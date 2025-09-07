// Vérification du schéma Neon
const { pool } = require('./neon-db');

async function checkNeonSchema() {
  try {
    console.log('🔍 Vérification du schéma Neon...');
    
    const client = await pool.connect();
    
    // Vérifier les tables existantes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables existantes:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Tables attendues
    const expectedTables = [
      'client', 'user', 'section_type', 'sous_section_type', 'item_type',
      'devis', 'section_instance', 'sous_section_instance', 'item_instance',
      'sous_item_type', 'sous_item_instance', 'remarque', 'password_reset_codes'
    ];
    
    console.log('\n🔍 Tables manquantes:');
    const existingTables = tablesResult.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('  ✅ Toutes les tables sont présentes !');
    } else {
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
    }
    
    // Vérifier les données
    console.log('\n📊 Données existantes:');
    for (const table of existingTables) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(`  ${table}: ${countResult.rows[0].count} enregistrements`);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkNeonSchema();