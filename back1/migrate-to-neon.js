// Migration des données de SQL Server vers Neon PostgreSQL
const { sql, config } = require('./db'); // Ancienne connexion SQL Server
const { pool } = require('./neon-db'); // Nouvelle connexion Neon

async function migrateToNeon() {
  let sqlServerPool;
  let neonClient;
  
  try {
    console.log('🔄 Début de la migration vers Neon...');
    
    // Connexion à SQL Server
    console.log('📡 Connexion à SQL Server...');
    sqlServerPool = await sql.connect(config);
    console.log('✅ Connexion SQL Server établie');
    
    // Connexion à Neon
    console.log('☁️ Connexion à Neon...');
    neonClient = await pool.connect();
    console.log('✅ Connexion Neon établie');
    
    // Migration des clients
    console.log('👥 Migration des clients...');
    const clientsResult = await sqlServerPool.request().query('SELECT * FROM client');
    for (const client of clientsResult.recordset) {
      await neonClient.query(`
        INSERT INTO client (id, nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          nom_entreprise = EXCLUDED.nom_entreprise,
          contact = EXCLUDED.contact,
          adresse = EXCLUDED.adresse,
          code_postal = EXCLUDED.code_postal,
          ville = EXCLUDED.ville,
          telephone = EXCLUDED.telephone,
          email = EXCLUDED.email,
          reference_client = EXCLUDED.reference_client
      `, [client.id, client.nom_entreprise, client.contact, client.adresse, 
          client.code_postal, client.ville, client.telephone, client.email, client.reference_client]);
    }
    console.log(`✅ ${clientsResult.recordset.length} clients migrés`);
    
    // Migration des utilisateurs
    console.log('👤 Migration des utilisateurs...');
    const usersResult = await sqlServerPool.request().query('SELECT * FROM [user]');
    for (const user of usersResult.recordset) {
      await neonClient.query(`
        INSERT INTO "user" (id, nom, email, mot_de_passe, role, date_creation)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          nom = EXCLUDED.nom,
          email = EXCLUDED.email,
          mot_de_passe = EXCLUDED.mot_de_passe,
          role = EXCLUDED.role,
          date_creation = EXCLUDED.date_creation
      `, [user.id, user.nom, user.email, user.mot_de_passe, user.role, user.date_creation]);
    }
    console.log(`✅ ${usersResult.recordset.length} utilisateurs migrés`);
    
    // Migration des devis
    console.log('📄 Migration des devis...');
    const devisResult = await sqlServerPool.request().query('SELECT * FROM devis');
    for (const devis of devisResult.recordset) {
      await neonClient.query(`
        INSERT INTO devis (id, reference, date, destinataire, societe, telephone, v_ref, objet, 
                          nombre_pages, client_id, user_id, date_creation, date_modification, 
                          elements, status, email_sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          reference = EXCLUDED.reference,
          date = EXCLUDED.date,
          destinataire = EXCLUDED.destinataire,
          societe = EXCLUDED.societe,
          telephone = EXCLUDED.telephone,
          v_ref = EXCLUDED.v_ref,
          objet = EXCLUDED.objet,
          nombre_pages = EXCLUDED.nombre_pages,
          client_id = EXCLUDED.client_id,
          user_id = EXCLUDED.user_id,
          date_creation = EXCLUDED.date_creation,
          date_modification = EXCLUDED.date_modification,
          elements = EXCLUDED.elements,
          status = EXCLUDED.status,
          email_sent_at = EXCLUDED.email_sent_at
      `, [devis.id, devis.reference, devis.date, devis.destinataire, devis.societe, 
          devis.telephone, devis.v_ref, devis.objet, devis.nombre_pages, devis.client_id, 
          devis.user_id, devis.date_creation, devis.date_modification, devis.elements, 
          devis.status, devis.email_sent_at]);
    }
    console.log(`✅ ${devisResult.recordset.length} devis migrés`);
    
    // Migration des remarques
    console.log('💬 Migration des remarques...');
    const remarquesResult = await sqlServerPool.request().query('SELECT * FROM remarque');
    for (const remarque of remarquesResult.recordset) {
      await neonClient.query(`
        INSERT INTO remarque (id, devis_id, element_type, element_id, contenu, 
                             date_creation, date_modification, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          devis_id = EXCLUDED.devis_id,
          element_type = EXCLUDED.element_type,
          element_id = EXCLUDED.element_id,
          contenu = EXCLUDED.contenu,
          date_creation = EXCLUDED.date_creation,
          date_modification = EXCLUDED.date_modification,
          user_id = EXCLUDED.user_id
      `, [remarque.id, remarque.devis_id, remarque.element_type, remarque.element_id, 
          remarque.contenu, remarque.date_creation, remarque.date_modification, remarque.user_id]);
    }
    console.log(`✅ ${remarquesResult.recordset.length} remarques migrées`);
    
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    if (sqlServerPool) {
      await sqlServerPool.close();
    }
    if (neonClient) {
      neonClient.release();
    }
    await pool.end();
  }
}

migrateToNeon();