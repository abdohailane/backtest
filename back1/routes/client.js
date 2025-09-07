const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { pool } = require("../neon-db");

// Liste des clients
router.get("/", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM client ORDER BY nom_entreprise');
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des clients:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Compter les clients
router.get("/count", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as total FROM client');
      res.json({ count: parseInt(result.rows[0].total) });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors du comptage des clients:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter un client
router.post("/", auth, async (req, res) => {
  const { nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client } = req.body;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO client (nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client]
      );
      res.status(201).json({ message: "Client ajouté", client: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de l'ajout du client:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier un client
router.put("/:id", auth, async (req, res) => {
  const { nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client } = req.body;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE client SET nom_entreprise = $1, contact = $2, adresse = $3, code_postal = $4, ville = $5, telephone = $6, email = $7, reference_client = $8 WHERE id = $9 RETURNING *',
        [nom_entreprise, contact, adresse, code_postal, ville, telephone, email, reference_client, req.params.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      res.json({ message: "Client modifié", client: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la modification du client:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// Récupérer un client par ID
router.get("/:id", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM client WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération du client:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer un client
router.delete("/:id", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM client WHERE id = $1', [req.params.id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      res.json({ message: "Client supprimé avec succès" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la suppression du client:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression" });
  }
});

module.exports = router;