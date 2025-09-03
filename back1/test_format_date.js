// Test pour vérifier le formatage de la date
console.log('=== TEST FORMATAGE DATE ===');

// Simuler la fonction formatDate du backend
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    // Si c'est déjà une date au format YYYY-MM-DD, la retourner
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Sinon, essayer de parser et formater
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    return dateString || '';
  }
}

// Tests avec différents formats de date
const testDates = [
  'Thu Aug 28 2025 02:00:00 GMT+0200 (heure d\'été d\'Europe centrale)',
  '2025-08-28',
  '2025-8-28',
  '28/08/2025',
  '2025-08-28T02:00:00.000Z',
  new Date('2025-08-28'),
  null,
  undefined
];

console.log('Tests de formatage de date:');
testDates.forEach((date, index) => {
  const formatted = formatDate(date);
  console.log(`Test ${index + 1}: "${date}" → "${formatted}"`);
});

// Test spécifique avec la date problématique
const problemDate = 'Thu Aug 28 2025 02:00:00 GMT+0200 (heure d\'été d\'Europe centrale)';
console.log(`\nTest spécifique:`);
console.log(`Date originale: ${problemDate}`);
console.log(`Date formatée: ${formatDate(problemDate)}`);
console.log(`Format attendu: 2025-08-28`);
console.log(`✅ Résultat correct: ${formatDate(problemDate) === '2025-08-28' ? 'OUI' : 'NON'}`); 