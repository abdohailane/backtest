// Test simple pour vérifier la récupération des données de prix
const testData = {
  elements: [
    {
      type: 'section',
      data: { id: 1, description: 'Bordereau de prix' }
    },
    {
      type: 'sousSection',
      data: { id: 101, description: 'Sablage SA2,5' },
      priceData: { qt: 100.0, pu: 45.50 }
    },
    {
      type: 'sousSection',
      data: { id: 102, description: 'Peinture époxy' },
      priceData: { qt: 200.0, pu: 75.25 }
    }
  ]
};

// Simuler l'extraction comme dans le backend
const devis = { ...testData };
devis.priceData = {};

devis.elements.forEach(element => {
  if (element.type === 'sousSection' && element.priceData) {
    devis.priceData[element.data.id] = element.priceData;
    console.log(`Prix extrait pour ${element.data.description}:`, element.priceData);
  }
});

console.log('\n=== RÉSULTAT FINAL ===');
console.log('priceData extrait:', JSON.stringify(devis.priceData, null, 2));

// Test de récupération dans le tableau de prix
const prixSousSections = devis.elements.filter(el => 
  el.type === 'sousSection' && 
  el.parentSection && 
  el.parentSection.description && 
  (el.parentSection.description.includes('Bordereau de prix') || el.parentSection.description.includes('Prix'))
) || [];

console.log('\n=== TEST TABLEAU DE PRIX ===');
prixSousSections.forEach(sousSection => {
  const priceInfo = devis.priceData[sousSection.data.id] || {};
  const qt = Number(priceInfo.qt || 0);
  const pu = Number(priceInfo.pu || 0);
  const total = qt * pu;
  
  console.log(`${sousSection.data.description}: QT=${qt}, PU=${pu}, Total=${total}`);
}); 