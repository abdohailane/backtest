// Test pour vérifier la structure du tableau de prix corrigé
console.log('=== TEST STRUCTURE TABLEAU DE PRIX ===');

// Simuler la fonction generateSectionContent pour le tableau de prix
function testTableauPrix() {
  const brandBlue = "0B3B7A";
  
  // Données de test
  const devis = {
    elements: [
      {
        type: 'section',
        data: { id: 1, description: 'Bordereau de prix' }
      },
      {
        type: 'sousSection',
        data: { id: 101, description: 'Surface intérieure des ballons' },
        priceData: { qt: 44.0, pu: 44.0 },
        unite: 'M²',
        parentSection: { id: 1, description: 'Bordereau de prix' }
      },
      {
        type: 'sousSection',
        data: { id: 102, description: 'Surface extérieure des ballons' },
        priceData: { qt: 44.0, pu: 44.0 },
        unite: 'M²',
        parentSection: { id: 1, description: 'Bordereau de prix' }
      }
    ],
    priceData: {},
    unites: {}
  };

  // Extraire les données
  devis.elements.forEach(element => {
    if (element.type === 'sousSection' && element.priceData) {
      devis.priceData[element.data.id] = element.priceData;
    }
    if (element.type === 'sousSection' && element.unite) {
      devis.unites[element.data.id] = element.unite;
    }
  });

  console.log('Données extraites:');
  console.log('priceData:', devis.priceData);
  console.log('unites:', devis.unites);

  // Générer le tableau de prix
  const prixSousSections = devis.elements.filter(el => 
    el.type === 'sousSection' && 
    el.parentSection && 
    el.parentSection.description && 
    (el.parentSection.description.includes('Bordereau de prix') || el.parentSection.description.includes('Prix'))
  );

  console.log('\nSous-sections trouvées:', prixSousSections.length);

  let html = `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000;">
  <thead>
    <tr style="background-color: #${brandBlue}; color: #fff;">
      <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Désignation</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Unité</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">QT</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">PU DHS HT</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">PT DHS HT</th>
    </tr>
  </thead>
  <tbody>`;

  if (prixSousSections.length > 0) {
    prixSousSections.forEach(sousSection => {
      const priceInfo = devis.priceData[sousSection.data.id] || {};
      const qt = Number(priceInfo.qt || 0);
      const pu = Number(priceInfo.pu || 0);
      const total = qt * pu;

      html += `
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">${sousSection.data?.description || ''}</td>
          <td style="border: 1px solid #000; padding: 8px;">${sousSection.unite || 'M²'}</td>
          <td style="border: 1px solid #000; padding: 8px;">${qt.toFixed(2)}</td>
          <td style="border: 1px solid #000; padding: 8px;">${pu.toFixed(2)}</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; color: #${brandBlue};">${total.toFixed(2)}</td>
        </tr>`;
    });
  } else {
    html += `<tr><td colspan="5" style="text-align:center; padding:8px;">Aucun élément trouvé</td></tr>`;
  }

  html += `</tbody></table>`;

  console.log('\nHTML généré:');
  console.log(html);
  
  return html;
}

// Exécuter le test
testTableauPrix(); 