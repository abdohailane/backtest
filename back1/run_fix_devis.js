const { sql, config } = require('./db');
const fs = require('fs');
const path = require('path');

async function fixDevisTable() {
  try {
    console.log('Connexion à la base de données...');
    await sql.connect(config);
    
    console.log('Lecture du script de correction...');
    const fixScript = fs.readFileSync(path.join(__dirname, 'fix_devis_table.sql'), 'utf8');
    
    console.log('Exécution du script de correction...');
    await sql.query(fixScript);
    
    console.log('✅ Correction de la table Devis terminée avec succès !');
    console.log('Les colonnes suivantes ont été ajoutées si elles n\'existaient pas :');
    console.log('- status (NVARCHAR(50), défaut: "non envoyé")');
    console.log('- remarques (NVARCHAR(MAX))');
    console.log('- unites (NVARCHAR(MAX))');
    console.log('- priceData (NVARCHAR(MAX))');
    console.log('- sousSectionValues (NVARCHAR(MAX))');
    console.log('- email_sent_at (DATETIME)');
    
    // Vérifier la structure finale
    console.log('\nVérification de la structure de la table...');
    const result = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Devis' 
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('\nStructure finale de la table Devis :');
    result.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE}, défaut: ${col.COLUMN_DEFAULT || 'NULL'})`);
    });
    
  } catch (err) {
    console.error('❌ Erreur lors de la correction de la table Devis:', err.message);
    console.error('Détails:', err);
  } finally {
    await sql.close();
    console.log('\nConnexion fermée.');
  }
}

// Exécuter la correction
fixDevisTable();