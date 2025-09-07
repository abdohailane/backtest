const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { pool } = require("../neon-db");
const nodemailer = require("nodemailer");

// Configuration email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'abderrahmenhailane@gmail.com',
    pass: process.env.EMAIL_PASS || 'npxn feww ajbk bfwl'
  }
});

// Liste des devis
router.get("/", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT d.*, c.nom_entreprise, c.contact, u.nom as user_name 
        FROM devis d 
        LEFT JOIN client c ON d.client_id = c.id 
        LEFT JOIN "user" u ON d.user_id = u.id
        ORDER BY d.date_creation DESC
      `);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer un devis par ID
router.get("/:id", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT d.*, c.nom_entreprise, c.contact, c.adresse, c.ville, c.code_postal, c.telephone as client_telephone, c.email as client_email,
               u.nom as user_name, u.email as user_email
        FROM devis d 
        LEFT JOIN client c ON d.client_id = c.id 
        LEFT JOIN "user" u ON d.user_id = u.id
        WHERE d.id = $1
      `, [req.params.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }
      
      const devis = result.rows[0];
      
      // Parser les éléments JSON comme dans votre système actuel
      if (devis.elements) {
        try {
          devis.elements = JSON.parse(devis.elements);
        } catch (parseError) {
          console.error("Erreur lors du parsing des éléments:", parseError);
          devis.elements = null;
        }
      }
      
      res.json(devis);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Créer un nouveau devis
router.post("/", auth, async (req, res) => {
  const { 
    reference, 
    date, 
    destinataire, 
    societe, 
    telephone, 
    v_ref, 
    objet, 
    nombre_pages,
    client_id,
    elements,
    remarques,
    unites,
    priceData,
    sousSectionValues,
    status = 'draft'
  } = req.body;

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO devis (
          reference, 
          date, 
          destinataire, 
          societe, 
          telephone, 
          v_ref, 
          objet, 
          nombre_pages,
          client_id,
          user_id,
          date_creation,
          elements,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)
        RETURNING *
      `, [
        reference, 
        date, 
        destinataire, 
        societe, 
        telephone, 
        v_ref, 
        objet, 
        nombre_pages,
        client_id,
        req.user.id,
        JSON.stringify(elements),
        status
      ]);
      
      res.status(201).json({ 
        message: "Devis créé avec succès", 
        devis: result.rows[0] 
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la création du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Mettre à jour un devis
router.put("/:id", auth, async (req, res) => {
  const { 
    reference, 
    date, 
    destinataire, 
    societe, 
    telephone, 
    v_ref, 
    objet, 
    nombre_pages,
    client_id,
    elements,
    status
  } = req.body;

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE devis SET
          reference = $1,
          date = $2,
          destinataire = $3,
          societe = $4,
          telephone = $5,
          v_ref = $6,
          objet = $7,
          nombre_pages = $8,
          client_id = $9,
          elements = $10,
          status = $11,
          date_modification = NOW()
        WHERE id = $12
        RETURNING *
      `, [
        reference, 
        date, 
        destinataire, 
        societe, 
        telephone, 
        v_ref, 
        objet, 
        nombre_pages,
        client_id,
        JSON.stringify(elements),
        status,
        req.params.id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }
      
      res.json({ 
        message: "Devis mis à jour avec succès", 
        devis: result.rows[0] 
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la mise à jour du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer un devis
router.delete("/:id", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM devis WHERE id = $1', [req.params.id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }
      
      res.json({ message: "Devis supprimé avec succès" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la suppression du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Envoyer un devis par email
router.post("/:id/send-email", auth, async (req, res) => {
  const { email, subject, message } = req.body;
  
  try {
    const client = await pool.connect();
    try {
      // Récupérer le devis
      const devisResult = await client.query(`
        SELECT d.*, c.nom_entreprise, c.contact
        FROM devis d 
        LEFT JOIN client c ON d.client_id = c.id 
        WHERE d.id = $1
      `, [req.params.id]);
      
      if (devisResult.rows.length === 0) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }
      
      const devis = devisResult.rows[0];
      
      // Préparer l'email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject || `Devis ${devis.reference}`,
        html: `
          <h2>Devis ${devis.reference}</h2>
          <p>${message || 'Veuillez trouver ci-joint votre devis.'}</p>
          <p><strong>Objet:</strong> ${devis.objet}</p>
          <p><strong>Date:</strong> ${devis.date}</p>
          <p><strong>Société:</strong> ${devis.societe}</p>
        `
      };
      
      // Envoyer l'email
      await transporter.sendMail(mailOptions);
      
      // Mettre à jour le statut du devis
      await client.query(
        'UPDATE devis SET email_sent_at = NOW() WHERE id = $1',
        [req.params.id]
      );
      
      res.json({ message: "Email envoyé avec succès" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les remarques d'un devis
router.get("/:id/remarques", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT r.*, u.nom as user_name
        FROM remarque r
        LEFT JOIN "user" u ON r.user_id = u.id
        WHERE r.devis_id = $1
        ORDER BY r.date_creation DESC
      `, [req.params.id]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des remarques:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter une remarque à un devis
router.post("/:id/remarques", auth, async (req, res) => {
  const { element_type, element_id, contenu } = req.body;
  
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO remarque (devis_id, element_type, element_id, contenu, user_id, date_creation, date_modification)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [req.params.id, element_type, element_id, contenu, req.user.id]);
      
      res.status(201).json({ 
        message: "Remarque ajoutée avec succès", 
        remarque: result.rows[0] 
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de l'ajout de la remarque:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;