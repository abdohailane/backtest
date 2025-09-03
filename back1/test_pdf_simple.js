// Test simple de la génération PDF
const { generateDevisHTML } = require('./routes/devis');

async function testPDF() {
  try {
    console.log('=== TEST GÉNÉRATION PDF ===');
    
    // Données de test simples
    const testDevis = {
      reference: "TEST001",
      date: "2025-01-15",
      destinataire: "Mr. Test",
      societe: "Entreprise Test",
      telephone: "0123456789",
      vRef: "REF001",
      objet: "Test génération PDF",
      nombrePages: 1,
      elements: [
        {
          type: 'section',
          data: { id: 1, description: 'Test Section' }
        }
      ],
      remarques: {},
      unites: {},
      priceData: {},
      sousSectionValues: {}
    };
    
    console.log('Génération du HTML...');
    const html = generateDevisHTML(testDevis);
    console.log('HTML généré avec succès !');
    console.log('Taille HTML:', html.length, 'caractères');
    
    console.log('\nDébut du HTML:');
    console.log(html.substring(0, 200) + '...');
    
    console.log('\nTest réussi ! La génération HTML fonctionne.');
    
  } catch (error) {
    console.error('ERREUR LORS DE LA GÉNÉRATION PDF:');
    console.error('Type d\'erreur:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le test
testPDF(); 