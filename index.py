"""
Script de preprocessing pour transformer des livres audio en dataset TTS
Compatible Windows - Optimisé pour 18h d'audio MP3
"""

import os
import sys
import json
import torch
import torchaudio
import whisper
import librosa
import soundfile as sf
import numpy as np
from pathlib import Path
from pydub import AudioSegment
from pydub.silence import split_on_silence
from tqdm import tqdm
from datetime import timedelta
import warnings
warnings.filterwarnings('ignore')

# ============================================
# CONFIGURATION
# ============================================

# Chemins
INPUT_DIR = r"C:\Users\Computer\Downloads\Training"
OUTPUT_DIR = r"C:\Users\Computer\Downloads\Training\dataset_prepared"
WAVS_DIR = os.path.join(OUTPUT_DIR, "wavs")
METADATA_FILE = os.path.join(OUTPUT_DIR, "metadata.csv")

# Paramètres audio
TARGET_SAMPLE_RATE = 22050  # Standard pour TTS
MIN_SEGMENT_LENGTH = 2.0    # secondes
MAX_SEGMENT_LENGTH = 10.0   # secondes
SILENCE_THRESH = -40        # dB (ajuster si trop/pas assez de découpage)
MIN_SILENCE_LEN = 500       # ms

# Paramètres transcription
WHISPER_MODEL = "large-v3"  # Options: tiny, base, small, medium, large-v3
LANGUAGE = "fr"

# Validation qualité
MIN_AUDIO_QUALITY_DB = -30  # Rejeter segments trop faibles
MAX_AUDIO_LENGTH_CHARS = 200  # Rejeter transcriptions trop longues

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

def setup_directories():
    """Crée la structure de dossiers"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(WAVS_DIR, exist_ok=True)
    print(f"✅ Dossiers créés:\n  - {OUTPUT_DIR}\n  - {WAVS_DIR}")

def get_audio_files(directory):
    """Récupère tous les fichiers audio MP3"""
    audio_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.mp3'):
                audio_files.append(os.path.join(root, file))
    return sorted(audio_files)

def format_duration(seconds):
    """Formate la durée en heures:minutes:secondes"""
    return str(timedelta(seconds=int(seconds)))

def calculate_rms(audio_segment):
    """Calcule le volume RMS en dB"""
    return audio_segment.dBFS

def normalize_audio(audio_segment):
    """Normalise le volume audio"""
    target_dBFS = -20.0
    change_in_dBFS = target_dBFS - audio_segment.dBFS
    return audio_segment.apply_gain(change_in_dBFS)

def clean_text(text):
    """Nettoie le texte transcrit"""
    # Supprime espaces multiples
    text = ' '.join(text.split())
    # Capitalise première lettre
    if text:
        text = text[0].upper() + text[1:]
    return text.strip()

# ============================================
# PREPROCESSING PRINCIPAL
# ============================================

def load_and_split_audio(mp3_path):
    """
    Charge un MP3 et le découpe en segments basés sur les silences
    """
    print(f"\n📂 Traitement: {os.path.basename(mp3_path)}")
    
    # Charger l'audio
    audio = AudioSegment.from_mp3(mp3_path)
    duration = len(audio) / 1000.0  # en secondes
    print(f"   Durée totale: {format_duration(duration)}")
    
    # Normaliser le volume
    audio = normalize_audio(audio)
    
    # Découper sur les silences
    print(f"   🔪 Découpage en cours...")
    chunks = split_on_silence(
        audio,
        min_silence_len=MIN_SILENCE_LEN,
        silence_thresh=SILENCE_THRESH,
        keep_silence=200  # Garde 200ms de silence aux bords
    )
    
    print(f"   ✅ {len(chunks)} segments détectés")
    
    # Filtrer les segments par durée
    valid_chunks = []
    for chunk in chunks:
        duration_sec = len(chunk) / 1000.0
        if MIN_SEGMENT_LENGTH <= duration_sec <= MAX_SEGMENT_LENGTH:
            # Vérifier qualité audio
            if calculate_rms(chunk) > MIN_AUDIO_QUALITY_DB:
                valid_chunks.append(chunk)
    
    print(f"   ✅ {len(valid_chunks)} segments valides (après filtrage)")
    return valid_chunks

def export_segment(segment, output_path):
    """
    Exporte un segment audio en WAV avec le bon sample rate
    """
    # Export temporaire
    temp_path = output_path.replace('.wav', '_temp.wav')
    segment.export(temp_path, format="wav")
    
    # Resample avec librosa
    audio, sr = librosa.load(temp_path, sr=TARGET_SAMPLE_RATE, mono=True)
    sf.write(output_path, audio, TARGET_SAMPLE_RATE)
    
    # Nettoyer fichier temp
    os.remove(temp_path)

def transcribe_segments(wav_files, model):
    """
    Transcrit tous les segments audio avec Whisper
    """
    print(f"\n🎤 Transcription avec Whisper ({WHISPER_MODEL})...")
    
    metadata = []
    
    for wav_file in tqdm(wav_files, desc="Transcription"):
        try:
            # Transcription
            result = model.transcribe(
                wav_file,
                language=LANGUAGE,
                task="transcribe",
                fp16=False  # CPU compatible
            )
            
            text = clean_text(result["text"])
            
            # Validation
            if len(text) < 5:  # Trop court
                continue
            if len(text) > MAX_AUDIO_LENGTH_CHARS:  # Trop long
                continue
            
            # Ajouter à metadata
            filename = os.path.basename(wav_file)
            metadata.append(f"{filename}|{text}")
            
        except Exception as e:
            print(f"\n⚠️ Erreur transcription {wav_file}: {e}")
            continue
    
    return metadata

# ============================================
# PIPELINE PRINCIPAL
# ============================================

def main():
    print("=" * 60)
    print("🎙️  PREPROCESSING AUDIOBOOK → TTS DATASET")
    print("=" * 60)
    
    # 1. Setup
    setup_directories()
    
    # 2. Trouver les fichiers MP3
    print(f"\n🔍 Recherche des fichiers MP3 dans: {INPUT_DIR}")
    mp3_files = get_audio_files(INPUT_DIR)
    
    if not mp3_files:
        print("❌ Aucun fichier MP3 trouvé !")
        return
    
    print(f"✅ {len(mp3_files)} fichier(s) trouvé(s)")
    
    # Calculer durée totale
    total_duration = 0
    for mp3 in mp3_files:
        audio = AudioSegment.from_mp3(mp3)
        total_duration += len(audio) / 1000.0
    
    print(f"📊 Durée totale: {format_duration(total_duration)}")
    
    # 3. Découpage et export
    print(f"\n{'='*60}")
    print("PHASE 1: DÉCOUPAGE")
    print(f"{'='*60}")
    
    segment_counter = 0
    all_wav_files = []
    
    for mp3_file in mp3_files:
        chunks = load_and_split_audio(mp3_file)
        
        # Exporter chaque segment
        for i, chunk in enumerate(tqdm(chunks, desc="Export segments")):
            segment_counter += 1
            output_filename = f"segment_{segment_counter:05d}.wav"
            output_path = os.path.join(WAVS_DIR, output_filename)
            
            export_segment(chunk, output_path)
            all_wav_files.append(output_path)
    
    print(f"\n✅ {len(all_wav_files)} segments exportés")
    
    # 4. Transcription
    print(f"\n{'='*60}")
    print("PHASE 2: TRANSCRIPTION")
    print(f"{'='*60}")
    
    print(f"⏳ Chargement du modèle Whisper '{WHISPER_MODEL}'...")
    print("   (Cela peut prendre quelques minutes la première fois)")
    
    model = whisper.load_model(WHISPER_MODEL)
    print("✅ Modèle chargé")
    
    metadata_entries = transcribe_segments(all_wav_files, model)
    
    # 5. Sauvegarder metadata
    print(f"\n{'='*60}")
    print("PHASE 3: FINALISATION")
    print(f"{'='*60}")
    
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        for entry in metadata_entries:
            f.write(entry + '\n')
    
    print(f"✅ Metadata sauvegardé: {METADATA_FILE}")
    
    # 6. Statistiques finales
    valid_segments = len(metadata_entries)
    total_segments = len(all_wav_files)
    success_rate = (valid_segments / total_segments * 100) if total_segments > 0 else 0
    
    # Calculer durée finale
    final_duration = 0
    for wav in all_wav_files:
        if os.path.exists(wav):
            audio, sr = librosa.load(wav, sr=None)
            final_duration += len(audio) / sr
    
    print(f"\n{'='*60}")
    print("📊 RÉSUMÉ")
    print(f"{'='*60}")
    print(f"✅ Segments totaux créés: {total_segments}")
    print(f"✅ Segments valides (avec transcription): {valid_segments}")
    print(f"✅ Taux de succès: {success_rate:.1f}%")
    print(f"✅ Durée finale du dataset: {format_duration(final_duration)}")
    print(f"✅ Sample rate: {TARGET_SAMPLE_RATE} Hz")
    print(f"\n📁 Dossier de sortie: {OUTPUT_DIR}")
    print(f"📄 Fichier metadata: {METADATA_FILE}")
    
    # 7. Instructions suivantes
    print(f"\n{'='*60}")
    print("🚀 PROCHAINES ÉTAPES")
    print(f"{'='*60}")
    print("1. Vérifiez quelques fichiers audio pour la qualité")
    print("2. Vérifiez metadata.csv pour la précision des transcriptions")
    print("3. Uploadez le dossier 'dataset_prepared' sur Kaggle")
    print("4. Utilisez le notebook Kaggle pour l'entraînement")
    
    print(f"\n✅ Preprocessing terminé avec succès !")

# ============================================
# EXÉCUTION
# ============================================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Arrêt demandé par l'utilisateur")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)