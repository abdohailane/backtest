const { sql, config } = require("./db");

async function testDevisTable() {
  try {
    await sql.connect(config);
    console.log("✅ Connexion à la base de données réussie");

    // Test de création d'un devis
    const testDevis = {
      reference: "L25040001",
      date: "2025-04-07",
      destinataire: "Mr. Test Client",
      societe: "Société Test",
      telephone: "0123456789",
      vRef: "REF001",
      objet: "Travaux de test",
      nombrePages: 2,
      client_id: 1, // Assurez-vous qu'un client avec cet ID existe
      user_id: 1    // Assurez-vous qu'un utilisateur avec cet ID existe
    };

    console.log("📝 Test de création d'un devis...");
    const result = await sql.query`
      INSERT INTO Devis (
        reference, 
        date, 
        destinataire, 
        societe, 
        telephone, 
        vRef, 
        objet, 
        nombrePages,
        client_id,
        user_id
      )
      OUTPUT INSERTED.id
      VALUES (
        ${testDevis.reference}, 
        ${testDevis.date}, 
        ${testDevis.destinataire}, 
        ${testDevis.societe}, 
        ${testDevis.telephone}, 
        ${testDevis.vRef}, 
        ${testDevis.objet}, 
        ${testDevis.nombrePages},
        ${testDevis.client_id},
        ${testDevis.user_id}
      )
    `;

    const devisId = result.recordset[0].id;
    console.log(`✅ Devis créé avec l'ID: ${devisId}`);

    // Test de récupération du devis
    console.log("📖 Test de récupération du devis...");
    const getResult = await sql.query`
      SELECT d.*, c.nom_entreprise, c.contact 
      FROM Devis d 
      LEFT JOIN Client c ON d.client_id = c.id 
      WHERE d.id = ${devisId}
    `;

    if (getResult.recordset.length > 0) {
      console.log("✅ Devis récupéré avec succès:");
      console.log(getResult.recordset[0]);
    } else {
      console.log("❌ Erreur: Devis non trouvé");
    }

    // Test de mise à jour du devis
    console.log("✏️ Test de mise à jour du devis...");
    await sql.query`
      UPDATE Devis SET
        objet = ${testDevis.objet + " - Modifié"},
        date_modification = GETDATE()
      WHERE id = ${devisId}
    `;
    console.log("✅ Devis mis à jour avec succès");

    // Test de suppression du devis
    console.log("🗑️ Test de suppression du devis...");
    await sql.query`DELETE FROM Devis WHERE id = ${devisId}`;
    console.log("✅ Devis supprimé avec succès");

    // Test de récupération de tous les devis
    console.log("📋 Test de récupération de tous les devis...");
    const allDevis = await sql.query`
      SELECT d.*, c.nom_entreprise, c.contact 
      FROM Devis d 
      LEFT JOIN Client c ON d.client_id = c.id 
      ORDER BY d.date_creation DESC
    `;
    console.log(`✅ ${allDevis.recordset.length} devis trouvés dans la base de données`);

  } catch (err) {
    console.error("❌ Erreur lors du test:", err);
  } finally {
    await sql.close();
    console.log("🔌 Connexion fermée");
  }
}

// Exécuter le test
testDevisTable(); 