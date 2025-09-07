const { sql, config } = require("./db");

// Script de validation pour vérifier que la synchronisation fonctionne correctement
async function validateSynchronization() {
  try {
    await sql.connect(config);
    
    console.log("=== VALIDATION DE LA SYNCHRONISATION ===\n");
    
    // 1. Vérifier la structure générale
    console.log("1. Vérification de la structure générale...");
    
    const devisResult = await sql.query`
      SELECT id, reference, elements, remarques, unites, priceData, sousSectionValues, status
      FROM Devis 
      WHERE elements IS NOT NULL
      ORDER BY date_creation DESC
    `;
    
    console.log(`${devisResult.recordset.length} devis trouvés avec des éléments.`);
    
    let validDevis = 0;
    let invalidDevis = 0;
    
    for (const devis of devisResult.recordset) {
      console.log(`\nValidation du devis: ${devis.reference} (ID: ${devis.id})`);
      
      try {
        const elements = JSON.parse(devis.elements);
        let isValid = true;
        const issues = [];
        
        // Vérifier la structure des éléments
        if (!Array.isArray(elements)) {
          issues.push("elements n'est pas un tableau");
          isValid = false;
        } else {
          elements.forEach((element, index) => {
            if (!element) {
              issues.push(`Élément ${index}: null ou undefined`);
              isValid = false;
            } else {
              if (!element.type) {
                issues.push(`Élément ${index}: type manquant`);
                isValid = false;
              }
              if (!element.data) {
                issues.push(`Élément ${index}: data manquant`);
                isValid = false;
              } else if (!element.data.id) {
                issues.push(`Élément ${index}: data.id manquant`);
                isValid = false;
              }
            }
          });
        }
        
        // Vérifier les données extraites
        if (devis.remarques) {
          try {
            const remarques = JSON.parse(devis.remarques);
            if (!remarques.sections || !remarques.sousSections || !remarques.items || !remarques.sousItems) {
              issues.push("Structure des remarques incomplète");
              isValid = false;
            }
          } catch (e) {
            issues.push("Erreur lors du parsing des remarques");
            isValid = false;
          }
        }
        
        if (devis.unites) {
          try {
            JSON.parse(devis.unites);
          } catch (e) {
            issues.push("Erreur lors du parsing des unités");
            isValid = false;
          }
        }
        
        if (devis.priceData) {
          try {
            JSON.parse(devis.priceData);
          } catch (e) {
            issues.push("Erreur lors du parsing des données de prix");
            isValid = false;
          }
        }
        
        if (devis.sousSectionValues) {
          try {
            JSON.parse(devis.sousSectionValues);
          } catch (e) {
            issues.push("Erreur lors du parsing des valeurs des sous-sections");
            isValid = false;
          }
        }
        
        if (isValid) {
          console.log(`  ✅ Devis valide`);
          validDevis++;
        } else {
          console.log(`  ❌ Devis invalide:`);
          issues.forEach(issue => console.log(`    - ${issue}`));
          invalidDevis++;
        }
        
      } catch (parseError) {
        console.log(`  ❌ Erreur lors du parsing des éléments: ${parseError.message}`);
        invalidDevis++;
      }
    }
    
    console.log(`\nRésumé de la validation:`);
    console.log(`  - Devis valides: ${validDevis}`);
    console.log(`  - Devis invalides: ${invalidDevis}`);
    console.log(`  - Total: ${validDevis + invalidDevis}`);
    
    // 2. Test de la logique d'extraction
    console.log("\n2. Test de la logique d'extraction...");
    
    if (validDevis > 0) {
      const testDevis = devisResult.recordset.find(d => {
        try {
          const elements = JSON.parse(d.elements);
          return Array.isArray(elements) && elements.length > 0;
        } catch (e) {
          return false;
        }
      });
      
      if (testDevis) {
        console.log(`Test avec le devis: ${testDevis.reference}`);
        
        try {
          const elements = JSON.parse(testDevis.elements);
          
          // Simuler l'extraction des données
          const extractedData = {
            remarques: { sections: {}, sousSections: {}, items: {}, sousItems: {} },
            unites: {},
            priceData: {},
            sousSectionValues: {}
          };
          
          elements.forEach(element => {
            if (!element || !element.type || !element.data) return;
            
            const id = element.data.id;
            
            // Extraction des remarques
            if (element.remarque) {
              if (element.type === 'section') {
                extractedData.remarques.sections[id] = element.remarque;
              } else if (element.type === 'sousSection') {
                extractedData.remarques.sousSections[id] = element.remarque;
              } else if (element.type === 'item') {
                extractedData.remarques.items[id] = element.remarque;
              } else if (element.type === 'sousItem') {
                extractedData.remarques.sousItems[id] = element.remarque;
              }
            }
            
            // Extraction des unités
            if ((element.type === 'sousItem' || element.type === 'sousSection') && (element.unite || element.unite === 0)) {
              extractedData.unites[id] = element.unite;
            }
            
            // Extraction des valeurs des sous-sections
            if (element.type === 'sousSection' && (element.value || element.value === 0)) {
              extractedData.sousSectionValues[id] = element.value;
            }
            
            // Extraction des données de prix
            if (element.type === 'sousSection' && element.priceData) {
              extractedData.priceData[id] = element.priceData;
            }
          });
          
          console.log(`  ✅ Extraction réussie:`);
          console.log(`    - Remarques: ${Object.keys(extractedData.remarques).reduce((sum, key) => sum + Object.keys(extractedData.remarques[key]).length, 0)} éléments`);
          console.log(`    - Unités: ${Object.keys(extractedData.unites).length} éléments`);
          console.log(`    - Données de prix: ${Object.keys(extractedData.priceData).length} éléments`);
          console.log(`    - Valeurs de sous-sections: ${Object.keys(extractedData.sousSectionValues).length} éléments`);
          
        } catch (extractionError) {
          console.log(`  ❌ Erreur lors de l'extraction: ${extractionError.message}`);
        }
      }
    }
    
    // 3. Test de la génération PDF
    console.log("\n3. Test de la génération PDF...");
    
    if (validDevis > 0) {
      const testDevis = devisResult.recordset.find(d => {
        try {
          const elements = JSON.parse(d.elements);
          return Array.isArray(elements) && elements.length > 0;
        } catch (e) {
          return false;
        }
      });
      
      if (testDevis) {
        console.log(`Test PDF avec le devis: ${testDevis.reference}`);
        
        try {
          // Simuler la génération PDF en vérifiant les données nécessaires
          const elements = JSON.parse(testDevis.elements);
          
          let pdfIssues = [];
          
          elements.forEach((element, index) => {
            if (!element || !element.type || !element.data) {
              pdfIssues.push(`Élément ${index}: structure invalide`);
              return;
            }
            
            const id = element.data.id;
            
            // Vérifier les données nécessaires selon le type
            if (element.type === 'sousSection') {
              // Vérifier si c'est une sous-section de prix
              const isPrixSection = element.parentSection && 
                (element.parentSection.description?.includes('Bordereau de prix') || 
                 element.parentSection.description?.includes('Prix'));
              
              if (isPrixSection) {
                // Vérifier les données de prix
                if (!element.priceData) {
                  pdfIssues.push(`Sous-section de prix ${id}: priceData manquant`);
                } else {
                  if (!element.priceData.qt && element.priceData.qt !== 0) {
                    pdfIssues.push(`Sous-section de prix ${id}: qt manquant`);
                  }
                  if (!element.priceData.pu && element.priceData.pu !== 0) {
                    pdfIssues.push(`Sous-section de prix ${id}: pu manquant`);
                  }
                }
              }
              
              // Vérifier l'unité
              if (!element.unite && element.unite !== 0) {
                pdfIssues.push(`Sous-section ${id}: unite manquant`);
              }
            }
            
            if (element.type === 'sousItem') {
              // Vérifier l'unité
              if (!element.unite && element.unite !== 0) {
                pdfIssues.push(`Sous-item ${id}: unite manquant`);
              }
            }
          });
          
          if (pdfIssues.length > 0) {
            console.log(`  ⚠️  Problèmes détectés pour la génération PDF:`);
            pdfIssues.forEach(issue => console.log(`    - ${issue}`));
          } else {
            console.log(`  ✅ Aucun problème détecté pour la génération PDF`);
          }
          
        } catch (pdfError) {
          console.log(`  ❌ Erreur lors du test PDF: ${pdfError.message}`);
        }
      }
    }
    
    // 4. Recommandations
    console.log("\n4. Recommandations:");
    
    if (invalidDevis > 0) {
      console.log(`  ⚠️  ${invalidDevis} devis ont des problèmes de structure.`);
      console.log(`  💡 Exécutez le script de correction: node fix_data_synchronization.js`);
    }
    
    if (validDevis > 0) {
      console.log(`  ✅ ${validDevis} devis ont une structure valide.`);
      console.log(`  💡 La synchronisation devrait fonctionner correctement.`);
    }
    
    console.log(`  💡 Pour tester la génération PDF, utilisez l'endpoint: GET /devis/:id/pdf`);
    console.log(`  💡 Pour tester l'envoi d'email, utilisez l'endpoint: POST /devis/:id/send-email`);
    
    console.log("\n=== VALIDATION TERMINÉE ===");
    
  } catch (err) {
    console.error("Erreur générale:", err.message);
  } finally {
    await sql.close();
  }
}

// Exécuter la validation
validateSynchronization().catch(console.error);