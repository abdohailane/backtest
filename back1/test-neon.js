// Test de connexion à Neon
const { pool } = require('./neon-db');

async function testNeonConnection() {
  try {
    console.log('🔄 Test de connexion à Neon...');
    
    // Test de connexion
    const client = await pool.connect();
    console.log('✅ Connexion à Neon réussie !');
    
    // Test de requête simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Heure actuelle:', result.rows[0].current_time);
    
    // Test des tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables disponibles:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur de connexion à Neon:', error.message);
    console.error('💡 Vérifiez votre DATABASE_URL dans le fichier .env');
  } finally {
    await pool.end();
  }
}

testNeonConnection();