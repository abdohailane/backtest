const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { pool } = require("../neon-db");
const { sendRegistrationNotificationToAdmins, sendUserConfirmation } = require("../utils/emailService");

router.post("/login", async (req, res) => {
  const { email, mot_de_passe } = req.body;
  console.log("Reçu du frontend :", email, mot_de_passe);
  
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM "user" WHERE email = $1', [email]);
      const user = result.rows[0];
      console.log("Utilisateur trouvé :", user);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      if (mot_de_passe !== user.mot_de_passe) {
        return res.status(401).json({ message: "Mot de passe incorrect" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Connexion réussie",
        token,
        user: {
          id: user.id,
          nom: user.nom,
          email: user.email,
          role: user.role
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/register", async (req, res) => {
  const { nom, email, mot_de_passe, role = "employe" } = req.body;
  
  try {
    const client = await pool.connect();
    
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await client.query('SELECT id FROM "user" WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      // Créer le nouvel utilisateur
      const result = await client.query(
        'INSERT INTO "user" (nom, email, mot_de_passe, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [nom, email, mot_de_passe, role]
      );

      const newUser = result.rows[0];
      
      // Envoyer notification aux admins
      await sendRegistrationNotificationToAdmins(newUser);
      
      res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: {
          id: newUser.id,
          nom: newUser.nom,
          email: newUser.email,
          role: newUser.role
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;