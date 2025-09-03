const { sql, config } = require('./db');

async function testDevisSave() {
  try {
    console.log('🔍 Test de la sauvegarde des devis...');
    await sql.connect(config);
    
    // Vérifier la structure de la table
    console.log('\n📋 Vérification de la structure de la table Devis :');
    const structure = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Devis' 
      ORDER BY ORDINAL_POSITION
    `;
    
    structure.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE})`);
    });
    
    // Vérifier les colonnes nécessaires
    const requiredColumns = ['status', 'remarques', 'unites', 'priceData', 'sousSectionValues', 'email_sent_at'];
    const existingColumns = structure.recordset.map(col => col.COLUMN_NAME);
    
    console.log('\n✅ Vérification des colonnes requises :');
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`  ✅ ${col} - Présente`);
      } else {
        console.log(`  ❌ ${col} - Manquante`);
      }
    });
    
    // Tester une insertion simple
    console.log('\n🧪 Test d\'insertion d\'un devis de test...');
    try {
      const testDevis = {
        reference: 'TEST_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        destinataire: 'Test Client',
        societe: 'Test Company',
        telephone: '0123456789',
        vRef: 'TEST_REF',
        objet: 'Test de sauvegarde',
        nombrePages: 1,
        client_id: 1, // Assumer qu'il y a au moins un client
        elements: JSON.stringify([{
          type: 'section',
          data: { id: 1, description: 'Test Section' },
          remarque: 'Test remarque'
        }]),
        remarques: JSON.stringify({ sections: { 1: 'Test remarque' } }),
        unites: JSON.stringify({}),
        priceData: JSON.stringify({}),
        sousSectionValues: JSON.stringify({}),
        status: 'non envoyé'
      };
      
      const result = await sql.query`
        INSERT INTO Devis (
          reference, date, destinataire, societe, telephone, vRef, objet, 
          nombrePages, client_id, user_id, date_creation, elements,
          remarques, unites, priceData, sousSectionValues, status
        )
        OUTPUT INSERTED.id
        VALUES (
          ${testDevis.reference}, ${testDevis.date}, ${testDevis.destinataire}, 
          ${testDevis.societe}, ${testDevis.telephone}, ${testDevis.vRef}, 
          ${testDevis.objet}, ${testDevis.nombrePages}, ${testDevis.client_id}, 
          1, GETDATE(), ${testDevis.elements}, ${testDevis.remarques}, 
          ${testDevis.unites}, ${testDevis.priceData}, ${testDevis.sousSectionValues}, 
          ${testDevis.status}
        )
      `;
      
      const testId = result.recordset[0].id;
      console.log(`  ✅ Devis de test créé avec l'ID: ${testId}`);
      
      // Nettoyer le test
      await sql.query`DELETE FROM Devis WHERE id = ${testId}`;
      console.log(`  🧹 Devis de test supprimé`);
      
    } catch (insertError) {
      console.log(`  ❌ Erreur lors de l'insertion de test: ${insertError.message}`);
    }
    
    console.log('\n🎉 Test terminé !');
    
  } catch (err) {
    console.error('❌ Erreur lors du test:', err.message);
  } finally {
    await sql.close();
  }
}

// Exécuter le test
testDevisSave();