// Test simple pour vérifier la couleur de fond du tableau
console.log('=== TEST COULEUR TABLEAU ===');

const brandBlue = "0B3B7A";

// Générer le tableau avec la couleur de fond
const html = `
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
  <tbody>
    <tr>
      <td style="border: 1px solid #000; padding: 8px;">Surface intérieure des ballons</td>
      <td style="border: 1px solid #000; padding: 8px;">M²</td>
      <td style="border: 1px solid #000; padding: 8px;">44.00</td>
      <td style="border: 1px solid #000; padding: 8px;">44.00</td>
      <td style="border: 1px solid #000; padding: 8px; font-weight: bold; color: #${brandBlue};">1936.00</td>
    </tr>
  </tbody>
</table>`;

console.log('HTML généré:');
console.log(html);

console.log('\nVérifications:');
console.log(`- brandBlue: #${brandBlue}`);
console.log(`- Couleur de fond de l'en-tête: #${brandBlue}`);
console.log(`- Couleur du texte de l'en-tête: #fff (blanc)`);
console.log(`- Couleur du total: #${brandBlue}`); 