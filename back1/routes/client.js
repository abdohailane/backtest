const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sql, config } = require("../db");

// Liste des clients
router.get("/", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Client`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Compter les clients
router.get("/count", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT COUNT(*) as total FROM Client`;
    res.json({ count: result.recordset[0].total });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter un client
router.post("/", auth, async (req, res) => {
  const { non, nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client } = req.body;
  try {
    await sql.connect(config);
    await sql.query`
      INSERT INTO Client ( nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client)
      VALUES ( ${nom_entreprise}, ${contact}, ${adresse}, ${code_postal}, ${ville}, ${telephone}, ${email}, ${reference_client})
    `;
    res.status(201).json({ message: "Client ajouté" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier un client
router.put("/:id", auth, async (req, res) => {
  const { nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client } = req.body;
  try {
    await sql.connect(config);
    await sql.query`
      UPDATE Client SET
        nom_entreprise = ${nom_entreprise},
        contact = ${contact},
        adresse = ${adresse},
        code_postal = ${code_postal},
        ville = ${ville},
        telephone = ${telephone},
        email = ${email},
        reference_client = ${reference_client}
      WHERE id = ${req.params.id}
    `;
    res.json({ message: "Client modifié" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }

});
router.get("/:id", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Client WHERE id = ${req.params.id}`;
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Client non trouvé" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer un client
router.delete("/:id", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`DELETE FROM Client WHERE id = ${req.params.id}`;
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Client non trouvé" });
    }
    
    res.json({ message: "Client supprimé avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression du client:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression" });
  }
});

module.exports = router;