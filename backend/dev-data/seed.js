const mongoose = require('mongoose');
const { Book, Reading, TextCache } = require("../models"); // Ajustez le chemin selon votre structure

// Configuration MongoDB
const MONGODB_URI = "mongodb+srv://omari:omari@cluster0.f1lnv9w.mongodb.net/"

/**
 * Script pour vider complètement la base de données
 */
async function clearDatabase() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Compter les documents avant suppression
    const bookCount = await Book.countDocuments();
    const readingCount = await Reading.countDocuments();
    const textCacheCount = await TextCache.countDocuments();

    console.log('\n📊 État actuel de la base:');
    console.log(`   - Books: ${bookCount}`);
    console.log(`   - Readings: ${readingCount}`);
    console.log(`   - TextCache: ${textCacheCount}`);
    console.log(`   - Total: ${bookCount + readingCount + textCacheCount} documents\n`);

    if (bookCount + readingCount + textCacheCount === 0) {
      console.log('✨ La base de données est déjà vide!');
      await mongoose.disconnect();
      return;
    }

    console.log('🗑️  Suppression en cours...');

    // Supprimer toutes les collections
    await Book.deleteMany({});
    console.log('   ✓ Books supprimés');

    await Reading.deleteMany({});
    console.log('   ✓ Readings supprimés');

    await TextCache.deleteMany({});
    console.log('   ✓ TextCache supprimés');

    console.log('\n✅ Base de données vidée avec succès!');
    console.log(`   ${bookCount + readingCount + textCacheCount} documents supprimés\n`);

    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du vidage de la base:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Exécuter le script
clearDatabase();