const { sql, config } = require("./db");

async function testEmailData() {
  try {
    await sql.connect(config);
    console.log('Connexion à la base de données réussie');
    
    // Récupérer un devis existant pour tester
    const result = await sql.query`
      SELECT TOP 1 d.*, c.nom_entreprise, c.contact, c.telephone as client_telephone, c.email, u.nom as user_name
      FROM Devis d 
      LEFT JOIN Client c ON d.client_id = c.id 
      LEFT JOIN [User] u ON d.user_id = u.id
      WHERE d.elements IS NOT NULL
    `;
    
    if (result.recordset.length === 0) {
      console.log('Aucun devis trouvé avec des éléments');
      return;
    }
    
    const devis = result.recordset[0];
    console.log('Devis trouvé:', devis.reference);
    
    // Parser les éléments
    if (devis.elements) {
      try {
        devis.elements = JSON.parse(devis.elements);
        console.log('Éléments parsés avec succès');
        
        // Extraire les données comme dans le backend
        devis.remarques = { sections: {}, sousSections: {}, items: {}, sousItems: {} };
        devis.unites = {};
        devis.priceData = {};
        devis.sousSectionValues = {};
        
        devis.elements.forEach(element => {
          if (!element || !element.type || !element.data) return;
          
          const id = element.data.id;
          console.log(`Traitement élément ${element.type} avec ID ${id}`);
          
          // Extraire les remarques
          if (element.remarque) {
            if (element.type === 'section') devis.remarques.sections[id] = element.remarque;
            if (element.type === 'sousSection') devis.remarques.sousSections[id] = element.remarque;
            if (element.type === 'item') devis.remarques.items[id] = element.remarque;
            if (element.type === 'sousItem') devis.remarques.sousItems[id] = element.remarque;
            console.log(`Remarque trouvée pour ${element.type} ${id}:`, element.remarque);
          }
          
          // Extraire les unités
          if (element.type === 'sousItem' && (element.unite || element.unite === 0)) {
            devis.unites[id] = element.unite;
            console.log(`Unité trouvée pour sous-item ${id}:`, element.unite);
          }
          
          // Extraire les valeurs
          if (element.type === 'sousSection' && (element.value || element.value === 0)) {
            devis.sousSectionValues[id] = element.value;
            console.log(`Valeur trouvée pour sous-section ${id}:`, element.value);
          }
          
          // Extraire les données de prix
          if (element.type === 'sousSection' && element.priceData) {
            devis.priceData[id] = {
              qt: typeof element.priceData.qt === 'number' ? element.priceData.qt : parseFloat(element.priceData.qt) || 0,
              pu: typeof element.priceData.pu === 'number' ? element.priceData.pu : parseFloat(element.priceData.pu) || 0
            };
            console.log(`Données de prix trouvées pour sous-section ${id}:`, devis.priceData[id]);
          }
        });
        
        console.log('\n=== RÉSUMÉ DES DONNÉES EXTRACTES ===');
        console.log('Remarques:', JSON.stringify(devis.remarques, null, 2));
        console.log('Unités:', JSON.stringify(devis.unites, null, 2));
        console.log('Données de prix:', JSON.stringify(devis.priceData, null, 2));
        console.log('Valeurs sous-sections:', JSON.stringify(devis.sousSectionValues, null, 2));
        
      } catch (e) {
        console.error('Erreur lors du parsing des éléments:', e);
      }
    }
    
  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    await sql.close();
  }
}

testEmailData(); 