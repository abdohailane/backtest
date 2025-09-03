// Test simple pour vérifier la configuration email
const nodemailer = require('nodemailer');

// Configuration email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'abderrahmenhailane@gmail.com',
    pass: 'npxn feww ajbk bfwl'
  }
});

// Test d'envoi
async function testEmail() {
  try {
    console.log('Test d\'envoi d\'email...');
    
    const mailOptions = {
      from: 'abderrahmenhailane@gmail.com',
      to: 'abderrahmenhailane@gmail.com', // Envoyer à toi-même pour le test
      subject: 'Test - Envoi de devis par email',
      html: `
        <h2>Test d'envoi d'email</h2>
        <p>Ceci est un test pour vérifier que la configuration email fonctionne.</p>
        <p>Si tu reçois cet email, la configuration est correcte !</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
  }
}

// Exécuter le test
testEmail(); 