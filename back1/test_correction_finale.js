const { generateDevisHTML } = require('./routes/devis');

// Test avec la structure exacte comme dans ListDevis.js
const testDevisFinal = {
  reference: "L25080005",
  date: "2025-08-29",
  destinataire: "Mr. Test Final",
  societe: "Entreprise Test Final",
  telephone: "0123456789",
  vRef: "REF005",
  objet: "Test correction finale",
  nombrePages: 1,
  elements: [
    {
      type: 'section',
      data: { id: 1, description: 'Bordereau de prix' }
    },
    {
      id: 101,
      type: 'sousSection',
      data: { id: 101, description: 'Surface intérieure des ballons' },
      unite: 'M²',
      parentSection: { id: 1, description: 'Bordereau de prix' },
      // Structure comme dans ListDevis.js
      priceData: { qt: 150.0, pu: 45.50 }
    },
    {
      id: 102,
      type: 'sousSection',
      data: { id: 102, description: 'Surface extérieure des ballons' },
      unite: 'M²',
      parentSection: { id: 1, description: 'Bordereau de prix' },
      // Structure comme dans ListDevis.js
      priceData: { qt: 200.0, pu: 52.75 }
    }
  ],
  // Aussi tester avec la structure globale
  priceData: {
    "101": { qt: 300.0, pu: 60.00 },
    "102": { qt: 400.0, pu: 70.00 }
  }
};

console.log("=== TEST CORRECTION FINALE ===");
console.log("Structure du devis:", {
  reference: testDevisFinal.reference,
  elements: testDevisFinal.elements.length,
  priceData: testDevisFinal.priceData ? Object.keys(testDevisFinal.priceData) : 'undefined'
});

console.log("\nÉléments avec priceData:");
testDevisFinal.elements.forEach((el, index) => {
  if (el.type === 'sousSection') {
    console.log(`  [${index}] ID: ${el.id}, Description: ${el.data?.description}`);
    console.log(`       priceData:`, el.priceData);
    console.log(`       unite: ${el.unite}`);
  }
});

console.log("\nGénération du HTML...");
const html = generateDevisHTML(testDevisFinal);

// Vérifier que les prix sont correctement affichés
console.log("\nVérification des prix dans le HTML:");
const lines = html.split('\n');
lines.forEach((line, index) => {
  if (line.includes('Surface intérieure') || line.includes('Surface extérieure') || 
      line.includes('150.00') || line.includes('200.00') || 
      line.includes('45.50') || line.includes('52.75') ||
      line.includes('6825.00') || line.includes('10550.00')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});

// Sauvegarder le résultat
const fs = require('fs');
fs.writeFileSync('test_correction_finale.html', html);
console.log("\nFichier HTML sauvegardé : test_correction_finale.html");

// Vérifier que les prix ne sont plus à 0.00
if (html.includes('0.00') && (html.includes('Surface intérieure') || html.includes('Surface extérieure'))) {
  console.log("❌ PROBLÈME: Les prix sont toujours à 0.00");
} else {
  console.log("✅ SUCCÈS: Les prix sont correctement affichés");
}

// Vérifier que les totaux sont calculés correctement
const expectedTotals = {
  'Surface intérieure des ballons': 150.0 * 45.50, // 6825.00
  'Surface extérieure des ballons': 200.0 * 52.75  // 10550.00
};

Object.entries(expectedTotals).forEach(([description, expectedTotal]) => {
  if (html.includes(expectedTotal.toFixed(2))) {
    console.log(`✅ Total correct pour "${description}": ${expectedTotal.toFixed(2)}`);
  } else {
    console.log(`❌ Total incorrect pour "${description}": attendu ${expectedTotal.toFixed(2)}`);
  }
}); 