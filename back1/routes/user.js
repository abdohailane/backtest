const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { pool } = require("../neon-db");

router.get("/me", auth, async (req, res) => {
  console.log("Appel /me avec req.user :", req.user);
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, nom, email, role FROM "user" WHERE id = $1', [req.user.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur backend /me :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.put("/me", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const { nom, email, mot_de_passe, mot_de_passe_actuel } = req.body;
      
      // Si on veut changer le mot de passe, vérifier le mot de passe actuel
      if (mot_de_passe && mot_de_passe.trim() !== "") {
        // Récupérer le mot de passe actuel de l'utilisateur
        const currentUser = await client.query('SELECT mot_de_passe FROM "user" WHERE id = $1', [req.user.id]);
        
        if (currentUser.rows.length === 0) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        
        // Vérifier si le mot de passe actuel est fourni
        if (!mot_de_passe_actuel || mot_de_passe_actuel.trim() === "") {
          return res.status(400).json({ message: "Le mot de passe actuel est requis pour changer le mot de passe" });
        }
        
        // Vérifier si le mot de passe actuel est correct (comparaison en clair)
        const storedPassword = currentUser.rows[0].mot_de_passe || "";
        const isPasswordValid = mot_de_passe_actuel === storedPassword;
        
        if (!isPasswordValid) {
          return res.status(400).json({ message: "Le mot de passe actuel est incorrect" });
        }
        
        // Mettre à jour avec le nouveau mot de passe en clair (non recommandé)
        await client.query(
          'UPDATE "user" SET nom = $1, email = $2, mot_de_passe = $3 WHERE id = $4',
          [nom, email, mot_de_passe, req.user.id]
        );
      } else {
        // Si pas de changement de mot de passe, mettre à jour seulement nom et email
        await client.query(
          'UPDATE "user" SET nom = $1, email = $2 WHERE id = $3',
          [nom, email, req.user.id]
        );
      }
      
      // Retourne le user mis à jour
      const result = await client.query('SELECT id, nom, email, role FROM "user" WHERE id = $1', [req.user.id]);
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur backend /me PUT :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
