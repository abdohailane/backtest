// Script pour corriger les statuts existants dans la base de données
const { sql, config } = require('./db');

async function fixExistingStatus() {
  try {
    console.log('🔧 Correction des statuts existants...');
    
    // Se connecter à la base de données
    await sql.connect(config);
    console.log('✅ Connexion réussie');
    
    // Vérifier l'état actuel
    const before = await sql.query`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'non envoyé' THEN 1 ELSE 0 END) as non_envoye,
        SUM(CASE WHEN status = 'envoyé' THEN 1 ELSE 0 END) as envoye,
        SUM(CASE WHEN status = 'ouvert' THEN 1 ELSE 0 END) as ouvert,
        SUM(CASE WHEN status IS NULL THEN 1 ELSE 0 END) as null_status
      FROM Devis
    `;
    
    const stats = before.recordset[0];
    console.log('\n📊 État actuel:');
    console.log(`- Total devis: ${stats.total}`);
    console.log(`- Non envoyé: ${stats.non_envoye}`);
    console.log(`- Envoyé: ${stats.envoye}`);
    console.log(`- Ouvert: ${stats.ouvert}`);
    console.log(`- Status NULL: ${stats.null_status}`);
    
    // Corriger les statuts "ouvert" vers "envoyé"
    console.log('\n🔄 Correction des statuts "ouvert" vers "envoyé"...');
    const result1 = await sql.query`
      UPDATE Devis 
      SET status = 'envoyé'
      WHERE status = 'ouvert'
    `;
    console.log(`✅ ${result1.rowsAffected} statuts "ouvert" corrigés vers "envoyé"`);
    
    // Corriger les statuts NULL vers "non envoyé"
    console.log('\n🔄 Correction des statuts NULL vers "non envoyé"...');
    const result2 = await sql.query`
      UPDATE Devis 
      SET status = 'non envoyé'
      WHERE status IS NULL
    `;
    console.log(`✅ ${result2.rowsAffected} statuts NULL corrigés vers "non envoyé"`);
    
    // Vérifier l'état final
    const after = await sql.query`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'non envoyé' THEN 1 ELSE 0 END) as non_envoye,
        SUM(CASE WHEN status = 'envoyé' THEN 1 ELSE 0 END) as envoye
      FROM Devis
    `;
    
    const finalStats = after.recordset[0];
    console.log('\n📊 État final:');
    console.log(`- Total devis: ${finalStats.total}`);
    console.log(`- Non envoyé: ${finalStats.non_envoye}`);
    console.log(`- Envoyé: ${finalStats.envoye}`);
    
    console.log('\n🎉 Correction terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sql.close();
    console.log('🔒 Connexion fermée');
  }
}

fixExistingStatus();