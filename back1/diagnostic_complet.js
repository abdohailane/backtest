const express = require("express");
const nodemailer = require("nodemailer");
const { sql, config } = require("./db");

// Test complet du système
async function diagnosticComplet() {
  console.log('=== DIAGNOSTIC COMPLET DU SYSTÈME ===\n');
  
  // Test 1: Vérification des modules
  console.log('1. VÉRIFICATION DES MODULES');
  try {
    console.log('✅ Express:', express ? 'OK' : 'ERREUR');
    console.log('✅ Nodemailer:', nodemailer ? 'OK' : 'ERREUR');
    console.log('✅ SQL Server:', sql ? 'OK' : 'ERREUR');
    console.log('✅ Config DB:', config ? 'OK' : 'ERREUR');
  } catch (error) {
    console.error('❌ Erreur modules:', error.message);
  }
  
  // Test 2: Configuration email
  console.log('\n2. TEST CONFIGURATION EMAIL');
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'abderrahmenhailane@gmail.com',
        pass: 'npxn feww ajbk bfwl'
      }
    });
    
    console.log('✅ Transporter créé');
    
    // Vérifier la configuration
    await transporter.verify();
    console.log('✅ Configuration email valide');
    
    // Test d'envoi simple
    const mailOptions = {
      from: 'abderrahmenhailane@gmail.com',
      to: 'abderrahmenhailane@gmail.com',
      subject: 'Test Diagnostic',
      text: 'Test diagnostic système'
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de test envoyé, ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Erreur email:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('   SOLUTION: Problème d\'authentification Gmail');
      console.error('   - Activer l\'authentification à 2 facteurs');
      console.error('   - Générer un mot de passe d\'application');
    }
  }
  
  // Test 3: Connexion base de données
  console.log('\n3. TEST CONNEXION BASE DE DONNÉES');
  try {
    await sql.connect(config);
    console.log('✅ Connexion DB réussie');
    
    // Test requête simple
    const result = await sql.query`SELECT TOP 1 * FROM Devis`;
    console.log('✅ Requête DB réussie, résultats:', result.recordset.length);
    
    await sql.close();
    console.log('✅ Connexion DB fermée');
    
  } catch (error) {
    console.error('❌ Erreur DB:', error.message);
    console.error('   Code:', error.code);
  }
  
  // Test 4: Import des routes
  console.log('\n4. TEST IMPORT DES ROUTES');
  try {
    const devisRoutes = require('./routes/devis');
    console.log('✅ Routes devis importées');
    
    // Vérifier que les fonctions existent
    if (typeof devisRoutes.generateDevisHTML === 'function') {
      console.log('✅ Fonction generateDevisHTML disponible');
    } else {
      console.log('⚠️  Fonction generateDevisHTML manquante');
    }
    
  } catch (error) {
    console.error('❌ Erreur import routes:', error.message);
  }
  
  // Test 5: Génération HTML
  console.log('\n5. TEST GÉNÉRATION HTML');
  try {
    const { generateDevisHTML } = require('./routes/devis');
    
    const testDevis = {
      reference: "TEST001",
      date: "2025-01-15",
      destinataire: "Mr. Test",
      societe: "Entreprise Test",
      telephone: "0123456789",
      vRef: "REF001",
      objet: "Test",
      nombrePages: 1,
      elements: []
    };
    
    const html = generateDevisHTML(testDevis);
    console.log('✅ HTML généré, taille:', html.length, 'caractères');
    
  } catch (error) {
    console.error('❌ Erreur génération HTML:', error.message);
  }
  
  console.log('\n=== FIN DU DIAGNOSTIC ===');
}

// Exécuter le diagnostic
diagnosticComplet().catch(console.error); 