const nodemailer = require('nodemailer');

// Test simple de la configuration email
async function testEmail() {
  try {
    console.log('=== TEST CONFIGURATION EMAIL ===');
    
    // Configuration email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'abderrahmenhailane@gmail.com',
        pass: 'npxn feww ajbk bfwl'
      }
    });
    
    console.log('Transporter créé avec succès');
    
    // Tester la vérification de la configuration
    console.log('Vérification de la configuration...');
    await transporter.verify();
    console.log('Configuration email valide !');
    
    // Test d'envoi simple (sans PDF)
    const mailOptions = {
      from: 'abderrahmenhailane@gmail.com',
      to: 'abderrahmenhailane@gmail.com', // Envoyer à soi-même pour le test
      subject: 'Test Email - Devis System',
      html: '<h2>Test Email</h2><p>Ceci est un test de la configuration email.</p>'
    };
    
    console.log('Envoi du test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès !');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('ERREUR LORS DU TEST EMAIL:');
    console.error('Type d\'erreur:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    
    if (error.code === 'EAUTH') {
      console.error('\n=== PROBLÈME D\'AUTHENTIFICATION ===');
      console.error('Gmail a bloqué l\'authentification. Solutions possibles :');
      console.error('1. Activer l\'authentification à 2 facteurs sur le compte Gmail');
      console.error('2. Générer un mot de passe d\'application');
      console.error('3. Autoriser l\'accès aux applications moins sécurisées');
    }
    
    if (error.code === 'ECONNECTION') {
      console.error('\n=== PROBLÈME DE CONNEXION ===');
      console.error('Impossible de se connecter au serveur SMTP de Gmail');
    }
  }
}

// Exécuter le test
testEmail(); 