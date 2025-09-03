const { generateDevisHTML } = require('./routes/devis');

// Test de la génération HTML avec des données complètes
const testDevis = {
  reference: "L25080001",
  date: "2025-01-15",
  destinataire: "Mr. Jean Dupont",
  societe: "Entreprise Test SARL",
  telephone: "0123456789",
  vRef: "REF001",
  objet: "Rénovation complète des sols",
  nombrePages: 2,
  elements: [
    {
      type: 'section',
      data: { id: 1, description: 'Étendue des travaux' }
    },
    {
      type: 'sousSection',
      data: { id: 101, description: 'Préparation des supports' },
      parentSection: { id: 1, description: 'Étendue des travaux' }
    },
    {
      type: 'item',
      data: { id: 1001, description: 'Nettoyage des surfaces' },
      parentSousSection: { id: 101, description: 'Préparation des supports' },
      parentSection: { id: 1, description: 'Étendue des travaux' }
    },
    {
      type: 'sousItem',
      data: { id: 10001, description: 'Décapage mécanique' },
      unite: "150",
      parentItem: { id: 1001, description: 'Nettoyage des surfaces' },
      parentSousSection: { id: 101, description: 'Préparation des supports' },
      parentSection: { id: 1, description: 'Étendue des travaux' }
    },
    {
      type: 'section',
      data: { id: 2, description: 'Bordereau de prix' }
    },
    {
      type: 'sousSection',
      data: { id: 201, description: 'Application résine époxy', unite: 'M²' },
      parentSection: { id: 2, description: 'Bordereau de prix' }
    },
    {
      type: 'section',
      data: { id: 3, description: 'Délai de réalisation' }
    },
    {
      type: 'sousSection',
      data: { id: 301, description: 'Durée des travaux' },
      parentSection: { id: 3, description: 'Délai de réalisation' }
    }
  ],
  remarques: {
    sections: {
      1: "Tous les travaux seront effectués selon les normes en vigueur",
      2: "Prix HT, TVA 20% applicable",
      3: "Délai indicatif, peut varier selon les conditions météorologiques"
    },
    sousSections: {
      101: "Inclut la protection des zones adjacentes",
      201: "Prix par m² de surface traitée",
      301: "Sous réserve de conditions météorologiques favorables"
    },
    items: {
      1001: "Nettoyage complet avant application"
    },
    sousItems: {
      10001: "Épaisseur minimale garantie"
    }
  },
  unites: {
    10001: "150"
  },
  priceData: {
    201: {
      qt: 100.0,
      pu: 45.50
    }
  },
  sousSectionValues: {
    301: "4 semaines"
  }
};

console.log("=== TEST DE GÉNÉRATION HTML ===");
console.log("Données du devis:", JSON.stringify(testDevis, null, 2));

try {
  const html = generateDevisHTML(testDevis);
  console.log("\n=== HTML GÉNÉRÉ ===");
  console.log(html);
  
  // Sauvegarder le HTML dans un fichier pour vérification
  const fs = require('fs');
  fs.writeFileSync('test_devis_output.html', html);
  console.log("\nHTML sauvegardé dans 'test_devis_output.html'");
  
} catch (error) {
  console.error("Erreur lors de la génération:", error);
} 