const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { sql, config } = require("../db");
const { sendRegistrationNotificationToAdmins, sendUserConfirmation } = require("../utils/emailService");

router.post("/login", async (req, res) => {
  const { email, mot_de_passe } = req.body;
  console.log("Reçu du frontend :", email, mot_de_passe);
  try {
    await sql.connect(config);

    const result = await sql.query`SELECT * FROM [User] WHERE email = ${email}`;
    const user = result.recordset[0];
    console.log("Utilisateur trouvé :", user);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    if (mot_de_passe !== user.mot_de_passe) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      "mon_secret", // <-- clé secrète en dur pour tester
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role ,mot_de_passe:user.mot_de_passe }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour l'inscription - envoie email aux admins sans créer l'utilisateur
router.post("/register", async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;
  
  try {
    await sql.connect(config);
    
    // Vérifier si l'email existe déjà dans la table User
    const existingUser = await sql.query`SELECT * FROM [User] WHERE email = ${email}`;
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }
    
    // Récupérer tous les emails des administrateurs
    const adminsResult = await sql.query`SELECT email FROM [User] WHERE role = 'admin'`;
    const adminEmails = adminsResult.recordset.map(admin => admin.email);
    
    if (adminEmails.length === 0) {
      return res.status(500).json({ message: "Aucun administrateur trouvé pour traiter votre demande" });
    }
    
    // Préparer les données utilisateur
    const userData = { nom, email, mot_de_passe };
    
    // Envoyer les emails de notification aux admins
    try {
      await sendRegistrationNotificationToAdmins(adminEmails, userData);
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      return res.status(500).json({ message: "Erreur lors de l'envoi de la notification aux administrateurs" });
    }
    
    // Envoyer un email de confirmation à l'utilisateur
    try {
      await sendUserConfirmation(email, nom, 'pending');
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError);
      // Continue même si l'email de confirmation échoue
    }
    
    res.json({ 
      message: "Demande d'inscription envoyée avec succès. Un administrateur va examiner votre demande et vous recevrez un email de confirmation."
    });
    
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
});

// Route pour approuver/rejeter une demande via lien email (GET request)
router.get("/approve-user", async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">❌ Erreur</h2>
          <p>Token manquant dans l'URL</p>
        </body>
      </html>
    `);
  }
  
  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mon_secret');
    const { userData, action } = decoded;
    
    await sql.connect(config);
    
    if (action === 'approve') {
      // Vérifier à nouveau si l'email existe déjà
      const existingUser = await sql.query`SELECT * FROM [User] WHERE email = ${userData.email}`;
      if (existingUser.recordset.length > 0) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #ffc107;">⚠️ Attention</h2>
              <p>Cet utilisateur existe déjà dans la base de données.</p>
              <p><strong>Email:</strong> ${userData.email}</p>
            </body>
          </html>
        `);
      }
      
      // Approuver la demande : ajouter l'utilisateur à la table User
      await sql.query`
        INSERT INTO [User] (nom, email, mot_de_passe, role, date_creation)
        VALUES (${userData.nom}, ${userData.email}, ${userData.mot_de_passe}, 'user', GETDATE())
      `;
      
      // Envoyer un email de confirmation à l'utilisateur
      try {
        await sendUserConfirmation(userData.email, userData.nom, 'approved');
      } catch (emailError) {
        console.error('Erreur envoi email approbation:', emailError);
      }
      
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #28a745;">✅ Demande approuvée !</h2>
            <p>L'utilisateur <strong>${userData.nom}</strong> a été ajouté avec succès à la base de données.</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p>Un email de confirmation a été envoyé à l'utilisateur.</p>
          </body>
        </html>
      `);
      
    } else if (action === 'reject') {
      // Envoyer un email de rejet à l'utilisateur
      try {
        await sendUserConfirmation(userData.email, userData.nom, 'rejected');
      } catch (emailError) {
        console.error('Erreur envoi email rejet:', emailError);
      }
      
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">❌ Demande rejetée</h2>
            <p>La demande d'inscription de <strong>${userData.nom}</strong> a été rejetée.</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p>Un email de notification a été envoyé à l'utilisateur.</p>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">❌ Erreur</h2>
            <p>Action non valide</p>
          </body>
        </html>
      `);
    }
    
  } catch (err) {
    let errorMessage = "Erreur lors du traitement de la demande";
    if (err.name === 'TokenExpiredError') {
      errorMessage = "Le lien a expiré";
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = "Lien non valide";
    }
    
    console.error('Erreur approbation:', err);
    res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">❌ Erreur</h2>
          <p>${errorMessage}</p>
        </body>
      </html>
    `);
  }
});

module.exports = router;
