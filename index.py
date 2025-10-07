"""
Script de transcription optimisé pour segments audio déjà découpés
Utilise Faster-Whisper pour vitesse maximale sur CPU
"""

import os
import sys
import warnings
from pathlib import Path
from tqdm import tqdm
from datetime import timedelta
import librosa

warnings.filterwarnings('ignore')

# ============================================
# CONFIGURATION
# ============================================

# Chemins
WAVS_DIR = r"C:\Users\Computer\Downloads\Training\dataset_prepared\wavs"
OUTPUT_DIR = r"C:\Users\Computer\Downloads\Training\dataset_prepared"
METADATA_FILE = os.path.join(OUTPUT_DIR, "metadata.csv")

# Paramètres transcription
WHISPER_MODEL = "small"  # Options: tiny, base, small, medium, large-v3
LANGUAGE = "fr"

# Mode test (traiter seulement quelques fichiers)
TEST_MODE = False  # Mettez True pour tester
MAX_FILES_TEST = 20

# Validation qualité
MAX_TEXT_LENGTH = 200  # Caractères max
MIN_TEXT_LENGTH = 5    # Caractères min

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

def get_wav_files(directory):
    """Récupère tous les fichiers WAV"""
    wav_files = []
    for file in os.listdir(directory):
        if file.lower().endswith('.wav'):
            wav_files.append(os.path.join(directory, file))
    return sorted(wav_files)

def format_duration(seconds):
    """Formate la durée en heures:minutes:secondes"""
    return str(timedelta(seconds=int(seconds)))

def clean_text(text):
    """Nettoie le texte transcrit"""
    # Supprime espaces multiples
    text = ' '.join(text.split())
    # Capitalise première lettre
    if text:
        text = text[0].upper() + text[1:]
    return text.strip()

def calculate_total_duration(wav_files):
    """Calcule la durée totale des fichiers audio"""
    total_duration = 0
    print("📊 Calcul de la durée totale...")
    for wav_file in tqdm(wav_files[:100], desc="Échantillonnage"):  # Sample pour estimation
        try:
            audio, sr = librosa.load(wav_file, sr=None, duration=0.1)
            # Estimer durée complète
            import soundfile as sf
            info = sf.info(wav_file)
            total_duration += info.duration
        except:
            pass
    
    # Si moins de 100 fichiers, c'est exact, sinon on extrapole
    if len(wav_files) > 100:
        total_duration = total_duration * (len(wav_files) / 100)
    
    return total_duration

# ============================================
# TRANSCRIPTION AVEC FASTER-WHISPER
# ============================================

def transcribe_with_faster_whisper(wav_files, model):
    """
    Transcrit tous les segments audio avec Faster-Whisper
    """
    print(f"\n🎤 Transcription avec Faster-Whisper ({WHISPER_MODEL})...")
    
    metadata = []
    errors = []
    
    for wav_file in tqdm(wav_files, desc="Transcription"):
        try:
            # Transcription optimisée
            segments, info = model.transcribe(
                wav_file,
                language=LANGUAGE,
                beam_size=1,  # Plus rapide (1 au lieu de 5)
                vad_filter=True,  # Ignore les silences
                temperature=0.0  # Déterministe
            )
            
            # Combiner tous les segments
            text = " ".join([segment.text for segment in segments])
            text = clean_text(text)
            
            # Validation
            if len(text) < MIN_TEXT_LENGTH:
                errors.append((wav_file, "Texte trop court"))
                continue
            
            if len(text) > MAX_TEXT_LENGTH:
                errors.append((wav_file, "Texte trop long"))
                continue
            
            # Ajouter à metadata
            filename = os.path.basename(wav_file)
            metadata.append(f"{filename}|{text}")
            
        except Exception as e:
            errors.append((wav_file, str(e)))
            continue
    
    return metadata, errors

# ============================================
# TRANSCRIPTION AVEC WHISPER STANDARD (FALLBACK)
# ============================================

def transcribe_with_standard_whisper(wav_files, model):
    """
    Transcrit avec Whisper standard (si Faster-Whisper pas disponible)
    """
    print(f"\n🎤 Transcription avec Whisper standard ({WHISPER_MODEL})...")
    
    metadata = []
    errors = []
    
    for wav_file in tqdm(wav_files, desc="Transcription"):
        try:
            # Transcription
            result = model.transcribe(
                wav_file,
                language=LANGUAGE,
                task="transcribe",
                fp16=False,
                condition_on_previous_text=False,
                temperature=0.0
            )
            
            text = clean_text(result["text"])
            
            # Validation
            if len(text) < MIN_TEXT_LENGTH:
                errors.append((wav_file, "Texte trop court"))
                continue
            
            if len(text) > MAX_TEXT_LENGTH:
                errors.append((wav_file, "Texte trop long"))
                continue
            
            # Ajouter à metadata
            filename = os.path.basename(wav_file)
            metadata.append(f"{filename}|{text}")
            
        except Exception as e:
            errors.append((wav_file, str(e)))
            continue
    
    return metadata, errors

# ============================================
# PIPELINE PRINCIPAL
# ============================================

def main():
    print("=" * 60)
    print("🎙️  TRANSCRIPTION RAPIDE AVEC FASTER-WHISPER")
    print("=" * 60)
    
    # 1. Vérifier que le dossier existe
    if not os.path.exists(WAVS_DIR):
        print(f"❌ ERREUR: Dossier introuvable: {WAVS_DIR}")
        return
    
    # 2. Trouver les fichiers WAV
    print(f"\n🔍 Recherche des fichiers WAV dans: {WAVS_DIR}")
    wav_files = get_wav_files(WAVS_DIR)
    
    if not wav_files:
        print("❌ Aucun fichier WAV trouvé !")
        return
    
    print(f"✅ {len(wav_files)} fichier(s) trouvé(s)")
    
    # Mode test
    if TEST_MODE:
        wav_files = wav_files[:MAX_FILES_TEST]
        print(f"⚠️  MODE TEST: Traitement de {len(wav_files)} fichiers seulement")
    
    # Calculer durée totale
    total_duration = calculate_total_duration(wav_files)
    print(f"📊 Durée totale estimée: {format_duration(total_duration)}")
    
    # 3. Charger le modèle
    print(f"\n{'='*60}")
    print("CHARGEMENT DU MODÈLE")
    print(f"{'='*60}")
    
    use_faster_whisper = True
    
    try:
        from faster_whisper import WhisperModel
        print(f"⏳ Chargement de Faster-Whisper '{WHISPER_MODEL}'...")
        print("   (Optimisé pour CPU - 4-5x plus rapide)")
        
        model = WhisperModel(
            WHISPER_MODEL,
            device="cpu",
            compute_type="int8",  # Optimisation CPU
            num_workers=4  # Threads parallèles
        )
        print("✅ Faster-Whisper chargé avec succès !")
        
    except ImportError:
        print("⚠️  Faster-Whisper non installé, utilisation de Whisper standard")
        print("   Pour installer: pip install faster-whisper")
        use_faster_whisper = False
        
        import whisper
        print(f"⏳ Chargement de Whisper '{WHISPER_MODEL}'...")
        model = whisper.load_model(WHISPER_MODEL)
        print("✅ Whisper chargé")
    
    # 4. Transcription
    print(f"\n{'='*60}")
    print("TRANSCRIPTION EN COURS")
    print(f"{'='*60}")
    
    # Estimation du temps
    if WHISPER_MODEL == "tiny":
        time_per_sec = 0.5
    elif WHISPER_MODEL == "base":
        time_per_sec = 1.0 if use_faster_whisper else 3.0
    elif WHISPER_MODEL == "small":
        time_per_sec = 2.0 if use_faster_whisper else 5.0
    elif WHISPER_MODEL == "medium":
        time_per_sec = 4.0 if use_faster_whisper else 10.0
    else:  # large
        time_per_sec = 8.0 if use_faster_whisper else 20.0
    
    estimated_time = total_duration * time_per_sec
    print(f"⏱️  Temps estimé: {format_duration(estimated_time)}")
    print(f"🚀 Démarrage de la transcription...\n")
    
    if use_faster_whisper:
        metadata_entries, errors = transcribe_with_faster_whisper(wav_files, model)
    else:
        metadata_entries, errors = transcribe_with_standard_whisper(wav_files, model)
    
    # 5. Sauvegarder metadata
    print(f"\n{'='*60}")
    print("SAUVEGARDE DES RÉSULTATS")
    print(f"{'='*60}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        for entry in metadata_entries:
            f.write(entry + '\n')
    
    print(f"✅ Metadata sauvegardé: {METADATA_FILE}")
    
    # Sauvegarder les erreurs
    if errors:
        error_file = os.path.join(OUTPUT_DIR, "errors.txt")
        with open(error_file, 'w', encoding='utf-8') as f:
            for wav_file, error in errors:
                f.write(f"{os.path.basename(wav_file)}: {error}\n")
        print(f"⚠️  Fichier d'erreurs: {error_file}")
    
    # 6. Statistiques finales
    valid_segments = len(metadata_entries)
    total_segments = len(wav_files)
    failed_segments = len(errors)
    success_rate = (valid_segments / total_segments * 100) if total_segments > 0 else 0
    
    print(f"\n{'='*60}")
    print("📊 RÉSUMÉ")
    print(f"{'='*60}")
    print(f"✅ Fichiers traités: {total_segments}")
    print(f"✅ Transcriptions valides: {valid_segments}")
    print(f"❌ Erreurs/Rejets: {failed_segments}")
    print(f"✅ Taux de succès: {success_rate:.1f}%")
    print(f"✅ Durée du dataset: {format_duration(total_duration)}")
    print(f"✅ Modèle utilisé: {WHISPER_MODEL}")
    print(f"✅ Engine: {'Faster-Whisper (optimisé)' if use_faster_whisper else 'Whisper standard'}")
    
    print(f"\n📁 Fichiers générés:")
    print(f"   - {METADATA_FILE}")
    if errors:
        print(f"   - {error_file}")
    
    # 7. Aperçu des transcriptions
    print(f"\n{'='*60}")
    print("📝 APERÇU DES TRANSCRIPTIONS")
    print(f"{'='*60}")
    
    for i, entry in enumerate(metadata_entries[:5]):
        filename, text = entry.split('|', 1)
        print(f"{i+1}. {filename}")
        print(f"   {text[:100]}{'...' if len(text) > 100 else ''}\n")
    
    if len(metadata_entries) > 5:
        print(f"... et {len(metadata_entries) - 5} autres transcriptions")
    
    # 8. Instructions suivantes
    print(f"\n{'='*60}")
    print("🚀 PROCHAINES ÉTAPES")
    print(f"{'='*60}")
    print("1. Vérifiez metadata.csv pour la qualité des transcriptions")
    print("2. Écoutez quelques fichiers pour validation")
    if TEST_MODE:
        print("3. Si satisfait, relancez avec TEST_MODE = False")
        print("4. Uploadez le dataset complet sur Kaggle")
    else:
        print("3. Uploadez le dossier 'dataset_prepared' sur Kaggle")
        print("4. Lancez l'entraînement TTS sur Kaggle")
    
    print(f"\n✅ Transcription terminée avec succès !")

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