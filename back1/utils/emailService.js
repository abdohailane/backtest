const jwt = require('jsonwebtoken');

// Vérifier si nodemailer est installé
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('Nodemailer non installé. Les emails ne seront pas envoyés. Exécutez: npm install nodemailer');
  nodemailer = null;
}

// Configuration du transporteur email (à adapter selon votre fournisseur)
let transporter = null;

// Configuration email depuis les variables d'environnement
const EMAIL_USER = process.env.EMAIL_USER || 'abderrahmenhailane@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'npxn feww ajbk bfwl'; // IMPORTANT: Utilisez un mot de passe d'application, pas votre vrai mot de passe
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (nodemailer && EMAIL_USER && EMAIL_PASS && EMAIL_PASS !== 'votre_mot_de_passe_app_gmail') {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
    console.log('📧 Service email configuré avec Gmail pour:', EMAIL_USER);
  } catch (error) {
    console.error('Erreur configuration email:', error.message);
    transporter = null;
  }
} else {
  console.log('📧 Mode simulation email - Configurez EMAIL_USER et EMAIL_PASS dans le code');
}

// Fonction pour envoyer un email de notification aux admins avec les données utilisateur
async function sendRegistrationNotificationToAdmins(adminEmails, userData) {
  if (!transporter) {
    console.log('\n🔔 === EMAIL SIMULATION ===');
    console.log('📧 Email envoyé aux admins:', adminEmails.join(', '));
    console.log('👤 Nouvelle inscription:');
    console.log('   - Nom:', userData.nom);
    console.log('   - Email:', userData.email);
    console.log('🔗 Liens d\'approbation générés (simulation)');
    console.log('========================\n');
    return true;
  }
  
  try {
    // Créer un token de validation avec les données utilisateur
    const approvalToken = jwt.sign(
      { 
        userData: userData,
        action: 'approve'
      },
      process.env.JWT_SECRET || 'mon_secret',
      { expiresIn: '7d' }
    );

    const rejectionToken = jwt.sign(
      { 
        userData: userData,
        action: 'reject'
      },
      process.env.JWT_SECRET || 'mon_secret',
      { expiresIn: '7d' }
    );

    const approvalUrl = `${BASE_URL}/api/auth/approve-user?token=${approvalToken}`;
    const rejectionUrl = `${BASE_URL}/api/auth/approve-user?token=${rejectionToken}`;

    const emailContent = `
      <h2>Nouvelle demande d'inscription</h2>
      <p>Une nouvelle demande d'inscription a été reçue :</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        <p><strong>Nom :</strong> ${userData.nom}</p>
        <p><strong>Email :</strong> ${userData.email}</p>
        <p><strong>Date de demande :</strong> ${new Date().toLocaleString('fr-FR')}</p>
      </div>

      <p>Que souhaitez-vous faire avec cette demande ?</p>
      
      <div style="margin: 20px 0;">
        <a href="${approvalUrl}" 
           style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
           ✅ APPROUVER
        </a>
        
        <a href="${rejectionUrl}" 
           style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           ❌ REJETER
        </a>
      </div>
      
      <p style="color: #666; font-size: 12px;">
        Ces liens expirent dans 7 jours. En cliquant sur APPROUVER, l'utilisateur sera automatiquement ajouté à la base de données.
      </p>
    `;

    // Envoyer l'email à tous les admins
    for (const adminEmail of adminEmails) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: adminEmail,
        subject: `Nouvelle demande d'inscription - ${userData.nom}`,
        html: emailContent
      });
    }

    console.log(`Emails de notification envoyés à ${adminEmails.length} administrateurs`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails:', error);
    throw error;
  }
}

// Fonction pour envoyer un email de confirmation à l'utilisateur
async function sendUserConfirmation(userEmail, userName, status) {
  if (!transporter) {
    console.log(`\n📧 EMAIL SIMULATION - Confirmation envoyée à ${userEmail}`);
    console.log(`📝 Statut: ${status}`);
    console.log(`👤 Utilisateur: ${userName}\n`);
    return true;
  }
  
  try {
    let subject, content;
    
    if (status === 'approved') {
      subject = 'Votre inscription a été approuvée !';
      content = `
        <h2>Félicitations ${userName} !</h2>
        <p>Votre demande d'inscription a été approuvée par un administrateur.</p>
        <p>Vous pouvez maintenant vous connecter à votre compte avec vos identifiants.</p>
                 <p><a href="${FRONTEND_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Se connecter</a></p>
      `;
    } else if (status === 'rejected') {
      subject = 'Votre demande d\'inscription a été rejetée';
      content = `
        <h2>Bonjour ${userName},</h2>
        <p>Nous vous informons que votre demande d'inscription a été rejetée par un administrateur.</p>
        <p>Pour plus d'informations, vous pouvez contacter l'équipe d'administration.</p>
      `;
    } else {
      subject = 'Votre demande d\'inscription';
      content = `
        <h2>Bonjour ${userName},</h2>
        <p>Nous avons bien reçu votre demande d'inscription.</p>
        <p>Un administrateur va examiner votre demande et vous recevrez une notification par email dès qu'une décision sera prise.</p>
        <p>Merci pour votre patience.</p>
      `;
    }

    await transporter.sendMail({
      from: EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: content
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    throw error;
  }
}

module.exports = {
  sendRegistrationNotificationToAdmins,
  sendUserConfirmation
};