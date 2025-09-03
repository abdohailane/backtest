// Test complet pour vérifier la récupération des prix avec la logique corrigée
const testData = {
  elements: [
    {
      type: 'section',
      data: { id: 1, description: 'Bordereau de prix' }
    },
    {
      type: 'sousSection',
      data: { id: 101, description: 'Sablage SA2,5' },
      priceData: { qt: 100.0, pu: 45.50 },
      unite: 'M²',
      parentSection: { id: 1, description: 'Bordereau de prix' }
    },
    {
      type: 'sousSection',
      data: { id: 102, description: 'Peinture époxy' },
      priceData: { qt: 200.0, pu: 75.25 },
      unite: 'M²',
      parentSection: { id: 1, description: 'Bordereau de prix' }
    }
  ]
};

// Simuler l'extraction comme dans le backend
const devis = { ...testData };
devis.remarques = { sections: {}, sousSections: {}, items: {}, sousItems: {} };
devis.unites = {};
devis.priceData = {};
devis.sousSectionValues = {};

console.log('=== EXTRACTION DES DONNÉES ===');
devis.elements.forEach(element => {
  if (!element || !element.type || !element.data) return;
  
  const id = element.data.id;
  console.log(`\nTraitement élément ${element.type} avec ID ${id}`);
  
  // Extraire les données de prix
  if (element.type === 'sousSection' && element.priceData) {
    devis.priceData[id] = element.priceData;
    console.log(`✅ Prix extrait pour ${element.data.description}:`, element.priceData);
  }
  
  // Extraire les unités
  if (element.type === 'sousSection' && element.unite) {
    devis.unites[id] = element.unite;
    console.log(`✅ Unité extraite pour ${element.data.description}:`, element.unite);
  }
});

console.log('\n=== RÉSULTAT DE L\'EXTRACTION ===');
console.log('priceData:', JSON.stringify(devis.priceData, null, 2));
console.log('unites:', JSON.stringify(devis.unites, null, 2));

// Test de récupération dans le tableau de prix (logique corrigée)
console.log('\n=== TEST TABLEAU DE PRIX (LOGIQUE CORRIGÉE) ===');
const prixSousSections = devis.elements.filter(el => 
  el.type === 'sousSection' && 
  el.parentSection && 
  el.parentSection.description && 
  (el.parentSection.description.includes('Bordereau de prix') || el.parentSection.description.includes('Prix'))
) || [];

prixSousSections.forEach(sousSection => {
  console.log(`\n--- Sous-section: ${sousSection.data.description} ---`);
  console.log(`ID de la sous-section: ${sousSection.data.id}`);
  console.log(`ID utilisé pour priceData: ${sousSection.data.id}`);
  
  // LOGIQUE CORRIGÉE : utiliser sousSection.data.id au lieu de sousSection.id
  const priceInfo = devis.priceData[sousSection.data.id] || {};
  const unite = devis.unites[sousSection.data.id] || 'M²';
  
  console.log(`PriceInfo trouvé:`, priceInfo);
  console.log(`Unité trouvée:`, unite);
  
  const qt = Number(priceInfo.qt || 0);
  const pu = Number(priceInfo.pu || 0);
  const total = qt * pu;
  
  console.log(`Résultat: QT=${qt}, PU=${pu}, Total=${total}`);
});

// Test de la logique AVANT correction (pour comparaison)
console.log('\n=== COMPARAISON AVEC LOGIQUE AVANT CORRECTION ===');
prixSousSections.forEach(sousSection => {
  console.log(`\n--- Sous-section: ${sousSection.data.description} ---`);
  
  // LOGIQUE AVANT CORRECTION (incorrecte)
  const priceInfoIncorrect = devis.priceData[sousSection.id] || {};
  console.log(`AVANT correction (sousSection.id=${sousSection.id}):`, priceInfoIncorrect);
  
  // LOGIQUE APRÈS CORRECTION (correcte)
  const priceInfoCorrect = devis.priceData[sousSection.data.id] || {};
  console.log(`APRÈS correction (sousSection.data.id=${sousSection.data.id}):`, priceInfoCorrect);
}); 