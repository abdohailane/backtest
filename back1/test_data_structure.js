const { sql, config } = require("./db");

// Script de test pour vérifier la structure des données des devis
async function testDataStructure() {
  try {
    await sql.connect(config);
    
    console.log("=== TEST DE LA STRUCTURE DES DONNÉES DES DEVIS ===\n");
    
    // 1. Vérifier la structure de la table Devis
    console.log("1. Vérification de la structure de la table Devis:");
    try {
      const columnsResult = await sql.query`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Devis'
        ORDER BY ORDINAL_POSITION
      `;
      
      console.log("Colonnes disponibles:");
      columnsResult.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (err) {
      console.error("Erreur lors de la vérification des colonnes:", err.message);
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // 2. Récupérer un devis existant pour analyser sa structure
    console.log("2. Analyse d'un devis existant:");
    try {
      const devisResult = await sql.query`
        SELECT TOP 1 id, reference, elements, remarques, unites, priceData, sousSectionValues, status
        FROM Devis 
        ORDER BY date_creation DESC
      `;
      
      if (devisResult.recordset.length === 0) {
        console.log("Aucun devis trouvé dans la base de données.");
        return;
      }
      
      const devis = devisResult.recordset[0];
      console.log(`Devis analysé: ${devis.reference} (ID: ${devis.id})`);
      console.log(`Status: ${devis.status || 'non défini'}`);
      
      // Analyser la structure des éléments
      if (devis.elements) {
        console.log("\n--- Structure des éléments ---");
        try {
          const elements = JSON.parse(devis.elements);
          console.log(`Nombre d'éléments: ${elements.length}`);
          
          if (elements.length > 0) {
            console.log("\nPremier élément:");
            console.log(JSON.stringify(elements[0], null, 2));
            
            // Analyser les types d'éléments
            const types = {};
            elements.forEach(el => {
              if (el && el.type) {
                types[el.type] = (types[el.type] || 0) + 1;
              }
            });
            console.log("\nTypes d'éléments trouvés:");
            Object.entries(types).forEach(([type, count]) => {
              console.log(`  - ${type}: ${count} éléments`);
            });
            
            // Vérifier la structure des éléments
            console.log("\n--- Vérification de la structure des éléments ---");
            elements.forEach((el, index) => {
              if (!el) {
                console.log(`❌ Élément ${index}: null ou undefined`);
                return;
              }
              
              const issues = [];
              if (!el.type) issues.push("type manquant");
              if (!el.data) issues.push("data manquant");
              if (el.data && !el.data.id) issues.push("data.id manquant");
              
              if (issues.length > 0) {
                console.log(`❌ Élément ${index} (${el.type || 'type inconnu'}): ${issues.join(', ')}`);
              } else {
                console.log(`✅ Élément ${index} (${el.type}): structure correcte`);
              }
            });
          }
        } catch (parseError) {
          console.error("Erreur lors du parsing des éléments:", parseError.message);
          console.log("Contenu brut des éléments:", devis.elements);
        }
      } else {
        console.log("Aucun élément trouvé dans ce devis.");
      }
      
      // Analyser les autres données
      console.log("\n--- Autres données ---");
      
      if (devis.remarques) {
        try {
          const remarques = JSON.parse(devis.remarques);
          console.log("Remarques:", JSON.stringify(remarques, null, 2));
        } catch (e) {
          console.log("Remarques (brut):", devis.remarques);
        }
      } else {
        console.log("Aucune remarque trouvée.");
      }
      
      if (devis.unites) {
        try {
          const unites = JSON.parse(devis.unites);
          console.log("Unités:", JSON.stringify(unites, null, 2));
        } catch (e) {
          console.log("Unités (brut):", devis.unites);
        }
      } else {
        console.log("Aucune unité trouvée.");
      }
      
      if (devis.priceData) {
        try {
          const priceData = JSON.parse(devis.priceData);
          console.log("Données de prix:", JSON.stringify(priceData, null, 2));
        } catch (e) {
          console.log("Données de prix (brut):", devis.priceData);
        }
      } else {
        console.log("Aucune donnée de prix trouvée.");
      }
      
      if (devis.sousSectionValues) {
        try {
          const sousSectionValues = JSON.parse(devis.sousSectionValues);
          console.log("Valeurs des sous-sections:", JSON.stringify(sousSectionValues, null, 2));
        } catch (e) {
          console.log("Valeurs des sous-sections (brut):", devis.sousSectionValues);
        }
      } else {
        console.log("Aucune valeur de sous-section trouvée.");
      }
      
    } catch (err) {
      console.error("Erreur lors de l'analyse du devis:", err.message);
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // 3. Test de la logique d'extraction des données
    console.log("3. Test de la logique d'extraction des données:");
    try {
      const devisResult = await sql.query`
        SELECT TOP 1 id, reference, elements
        FROM Devis 
        WHERE elements IS NOT NULL
        ORDER BY date_creation DESC
      `;
      
      if (devisResult.recordset.length > 0) {
        const devis = devisResult.recordset[0];
        const elements = JSON.parse(devis.elements);
        
        // Simuler la logique d'extraction du backend
        const extractedData = {
          remarques: { sections: {}, sousSections: {}, items: {}, sousItems: {} },
          unites: {},
          priceData: {},
          sousSectionValues: {}
        };
        
        console.log("Simulation de l'extraction des données:");
        elements.forEach((element, index) => {
          if (!element || !element.type || !element.data) {
            console.log(`❌ Élément ${index}: structure invalide`);
            return;
          }
          
          const id = element.data.id;
          console.log(`\nÉlément ${index} (${element.type}, ID: ${id}):`);
          
          // Extraction des remarques
          if (element.remarque) {
            if (element.type === 'section') {
              extractedData.remarques.sections[id] = element.remarque;
              console.log(`  ✅ Remarque de section extraite: "${element.remarque}"`);
            } else if (element.type === 'sousSection') {
              extractedData.remarques.sousSections[id] = element.remarque;
              console.log(`  ✅ Remarque de sous-section extraite: "${element.remarque}"`);
            } else if (element.type === 'item') {
              extractedData.remarques.items[id] = element.remarque;
              console.log(`  ✅ Remarque d'item extraite: "${element.remarque}"`);
            } else if (element.type === 'sousItem') {
              extractedData.remarques.sousItems[id] = element.remarque;
              console.log(`  ✅ Remarque de sous-item extraite: "${element.remarque}"`);
            }
          } else {
            console.log(`  ⚠️  Aucune remarque trouvée`);
          }
          
          // Extraction des unités
          if ((element.type === 'sousItem' || element.type === 'sousSection') && (element.unite || element.unite === 0)) {
            extractedData.unites[id] = element.unite;
            console.log(`  ✅ Unité extraite: ${element.unite}`);
          } else {
            console.log(`  ⚠️  Aucune unité trouvée (type: ${element.type})`);
          }
          
          // Extraction des valeurs des sous-sections
          if (element.type === 'sousSection' && (element.value || element.value === 0)) {
            extractedData.sousSectionValues[id] = element.value;
            console.log(`  ✅ Valeur de sous-section extraite: ${element.value}`);
          } else {
            console.log(`  ⚠️  Aucune valeur de sous-section trouvée (type: ${element.type})`);
          }
          
          // Extraction des données de prix
          if (element.type === 'sousSection' && element.priceData) {
            extractedData.priceData[id] = element.priceData;
            console.log(`  ✅ Données de prix extraites:`, element.priceData);
          } else {
            console.log(`  ⚠️  Aucune donnée de prix trouvée (type: ${element.type})`);
          }
        });
        
        console.log("\n--- Résumé de l'extraction ---");
        console.log("Remarques extraites:");
        Object.entries(extractedData.remarques).forEach(([type, data]) => {
          const count = Object.keys(data).length;
          console.log(`  - ${type}: ${count} éléments`);
        });
        
        console.log(`Unités extraites: ${Object.keys(extractedData.unites).length} éléments`);
        console.log(`Données de prix extraites: ${Object.keys(extractedData.priceData).length} éléments`);
        console.log(`Valeurs de sous-sections extraites: ${Object.keys(extractedData.sousSectionValues).length} éléments`);
      }
      
    } catch (err) {
      console.error("Erreur lors du test d'extraction:", err.message);
    }
    
  } catch (err) {
    console.error("Erreur générale:", err.message);
  } finally {
    await sql.close();
  }
}

// Exécuter le test
testDataStructure().catch(console.error);