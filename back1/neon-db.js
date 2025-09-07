// Configuration pour Neon PostgreSQL
const { Pool } = require('pg');
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion à Neon établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion à Neon:', err);
});

module.exports = { pool };