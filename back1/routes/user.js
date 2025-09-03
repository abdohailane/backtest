const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sql, config } = require("../db");

router.get("/me", auth, async (req, res) => {
  console.log("Appel /me avec req.user :", req.user);
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT id, nom, email, role FROM [User] WHERE id = ${req.user.id}`;
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erreur backend /me :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.put("/me", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const { nom, email, mot_de_passe, mot_de_passe_actuel } = req.body;
    
    // Si on veut changer le mot de passe, vérifier le mot de passe actuel
    if (mot_de_passe && mot_de_passe.trim() !== "") {
      // Récupérer le mot de passe actuel de l'utilisateur
      const currentUser = await sql.query`SELECT mot_de_passe FROM [User] WHERE id = ${req.user.id}`;
      
      if (currentUser.recordset.length === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Vérifier si le mot de passe actuel est fourni
      if (!mot_de_passe_actuel || mot_de_passe_actuel.trim() === "") {
        return res.status(400).json({ message: "Le mot de passe actuel est requis pour changer le mot de passe" });
      }
      
      // Vérifier si le mot de passe actuel est correct (comparaison en clair)
      const storedPassword = currentUser.recordset[0].mot_de_passe || "";
      const isPasswordValid = mot_de_passe_actuel === storedPassword;
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Le mot de passe actuel est incorrect" });
      }
      
      // Mettre à jour avec le nouveau mot de passe en clair (non recommandé)
      await sql.query`
        UPDATE [User]
        SET nom = ${nom}, email = ${email}, mot_de_passe = ${mot_de_passe}
        WHERE id = ${req.user.id}
      `;
    } else {
      // Si pas de changement de mot de passe, mettre à jour seulement nom et email
      await sql.query`
        UPDATE [User]
        SET nom = ${nom}, email = ${email}
        WHERE id = ${req.user.id}
      `;
    }
    
    // Retourne le user mis à jour
    const result = await sql.query`SELECT id, nom, email, role FROM [User] WHERE id = ${req.user.id}`;
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erreur backend /me PUT :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
