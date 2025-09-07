const { sql, config } = require("./db");

// Script de correction pour résoudre les problèmes de synchronisation des données
async function fixDataSynchronization() {
  try {
    await sql.connect(config);
    
    console.log("=== CORRECTION DE LA SYNCHRONISATION DES DONNÉES ===\n");
    
    // 1. Vérifier et corriger la structure des éléments
    console.log("1. Correction de la structure des éléments...");
    
    const devisResult = await sql.query`
      SELECT id, reference, elements, remarques, unites, priceData, sousSectionValues
      FROM Devis 
      WHERE elements IS NOT NULL
      ORDER BY date_creation DESC
    `;
    
    let correctedCount = 0;
    
    for (const devis of devisResult.recordset) {
      console.log(`\nTraitement du devis: ${devis.reference} (ID: ${devis.id})`);
      
      try {
        const elements = JSON.parse(devis.elements);
        let hasChanges = false;
        
        // Vérifier et corriger chaque élément
        const correctedElements = elements.map((element, index) => {
          if (!element) {
            console.log(`  ❌ Élément ${index}: null, suppression`);
            hasChanges = true;
            return null;
          }
          
          // Vérifier la structure de base
          if (!element.type) {
            console.log(`  ❌ Élément ${index}: type manquant, suppression`);
            hasChanges = true;
            return null;
          }
          
          if (!element.data) {
            console.log(`  ❌ Élément ${index}: data manquant, création d'un objet vide`);
            hasChanges = true;
            return {
              ...element,
              data: { id: `generated_${Date.now()}_${index}` }
            };
          }
          
          if (!element.data.id) {
            console.log(`  ❌ Élément ${index}: data.id manquant, génération d'un ID`);
            hasChanges = true;
            return {
              ...element,
              data: {
                ...element.data,
                id: `generated_${Date.now()}_${index}`
              }
            };
          }
          
          // Vérifier les types valides
          const validTypes = ['section', 'sousSection', 'item', 'sousItem'];
          if (!validTypes.includes(element.type)) {
            console.log(`  ❌ Élément ${index}: type invalide "${element.type}", suppression`);
            hasChanges = true;
            return null;
          }
          
          console.log(`  ✅ Élément ${index} (${element.type}): structure correcte`);
          return element;
        }).filter(el => el !== null); // Supprimer les éléments null
        
        if (hasChanges) {
          // Mettre à jour la base de données
          await sql.query`
            UPDATE Devis 
            SET elements = ${JSON.stringify(correctedElements)}
            WHERE id = ${devis.id}
          `;
          
          console.log(`  ✅ Devis ${devis.reference} corrigé`);
          correctedCount++;
        } else {
          console.log(`  ✅ Devis ${devis.reference} déjà correct`);
        }
        
      } catch (parseError) {
        console.error(`  ❌ Erreur lors du parsing des éléments du devis ${devis.reference}:`, parseError.message);
      }
    }
    
    console.log(`\n${correctedCount} devis corrigés sur ${devisResult.recordset.length} devis analysés.`);
    
    // 2. Vérifier et corriger les données extraites
    console.log("\n2. Vérification des données extraites...");
    
    const devisWithData = await sql.query`
      SELECT id, reference, elements, remarques, unites, priceData, sousSectionValues
      FROM Devis 
      WHERE elements IS NOT NULL
      ORDER BY date_creation DESC
    `;
    
    for (const devis of devisWithData.recordset) {
      console.log(`\nVérification du devis: ${devis.reference} (ID: ${devis.id})`);
      
      try {
        const elements = JSON.parse(devis.elements);
        
        // Extraire les données selon la logique du backend
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
        
        // Vérifier si les données extraites sont cohérentes avec celles stockées
        let needsUpdate = false;
        
        // Vérifier les remarques
        if (devis.remarques) {
          try {
            const storedRemarques = JSON.parse(devis.remarques);
            const extractedRemarques = extractedData.remarques;
            
            // Comparer les structures
            const storedKeys = Object.keys(storedRemarques).length;
            const extractedKeys = Object.keys(extractedRemarques).reduce((sum, key) => sum + Object.keys(extractedRemarques[key]).length, 0);
            
            if (storedKeys !== extractedKeys) {
              console.log(`  ⚠️  Incohérence dans les remarques: ${storedKeys} vs ${extractedKeys}`);
              needsUpdate = true;
            }
          } catch (e) {
            console.log(`  ❌ Erreur lors du parsing des remarques stockées`);
            needsUpdate = true;
          }
        } else {
          console.log(`  ⚠️  Aucune remarque stockée, mise à jour nécessaire`);
          needsUpdate = true;
        }
        
        // Vérifier les unités
        if (devis.unites) {
          try {
            const storedUnites = JSON.parse(devis.unites);
            const storedKeys = Object.keys(storedUnites).length;
            const extractedKeys = Object.keys(extractedData.unites).length;
            
            if (storedKeys !== extractedKeys) {
              console.log(`  ⚠️  Incohérence dans les unités: ${storedKeys} vs ${extractedKeys}`);
              needsUpdate = true;
            }
          } catch (e) {
            console.log(`  ❌ Erreur lors du parsing des unités stockées`);
            needsUpdate = true;
          }
        } else {
          console.log(`  ⚠️  Aucune unité stockée, mise à jour nécessaire`);
          needsUpdate = true;
        }
        
        // Vérifier les données de prix
        if (devis.priceData) {
          try {
            const storedPriceData = JSON.parse(devis.priceData);
            const storedKeys = Object.keys(storedPriceData).length;
            const extractedKeys = Object.keys(extractedData.priceData).length;
            
            if (storedKeys !== extractedKeys) {
              console.log(`  ⚠️  Incohérence dans les données de prix: ${storedKeys} vs ${extractedKeys}`);
              needsUpdate = true;
            }
          } catch (e) {
            console.log(`  ❌ Erreur lors du parsing des données de prix stockées`);
            needsUpdate = true;
          }
        } else {
          console.log(`  ⚠️  Aucune donnée de prix stockée, mise à jour nécessaire`);
          needsUpdate = true;
        }
        
        // Vérifier les valeurs des sous-sections
        if (devis.sousSectionValues) {
          try {
            const storedSousSectionValues = JSON.parse(devis.sousSectionValues);
            const storedKeys = Object.keys(storedSousSectionValues).length;
            const extractedKeys = Object.keys(extractedData.sousSectionValues).length;
            
            if (storedKeys !== extractedKeys) {
              console.log(`  ⚠️  Incohérence dans les valeurs des sous-sections: ${storedKeys} vs ${extractedKeys}`);
              needsUpdate = true;
            }
          } catch (e) {
            console.log(`  ❌ Erreur lors du parsing des valeurs des sous-sections stockées`);
            needsUpdate = true;
          }
        } else {
          console.log(`  ⚠️  Aucune valeur de sous-section stockée, mise à jour nécessaire`);
          needsUpdate = true;
        }
        
        // Mettre à jour si nécessaire
        if (needsUpdate) {
          await sql.query`
            UPDATE Devis 
            SET 
              remarques = ${JSON.stringify(extractedData.remarques)},
              unites = ${JSON.stringify(extractedData.unites)},
              priceData = ${JSON.stringify(extractedData.priceData)},
              sousSectionValues = ${JSON.stringify(extractedData.sousSectionValues)}
            WHERE id = ${devis.id}
          `;
          
          console.log(`  ✅ Données extraites mises à jour pour le devis ${devis.reference}`);
        } else {
          console.log(`  ✅ Données extraites cohérentes pour le devis ${devis.reference}`);
        }
        
      } catch (parseError) {
        console.error(`  ❌ Erreur lors du traitement du devis ${devis.reference}:`, parseError.message);
      }
    }
    
    // 3. Vérifier la cohérence des données pour la génération PDF
    console.log("\n3. Vérification de la cohérence pour la génération PDF...");
    
    const devisForPDF = await sql.query`
      SELECT id, reference, elements, remarques, unites, priceData, sousSectionValues
      FROM Devis 
      WHERE elements IS NOT NULL
      ORDER BY date_creation DESC
    `;
    
    for (const devis of devisForPDF.recordset) {
      console.log(`\nVérification PDF du devis: ${devis.reference} (ID: ${devis.id})`);
      
      try {
        const elements = JSON.parse(devis.elements);
        
        // Vérifier que tous les éléments ont les données nécessaires pour la génération PDF
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
        
      } catch (parseError) {
        console.error(`  ❌ Erreur lors de la vérification PDF du devis ${devis.reference}:`, parseError.message);
      }
    }
    
    console.log("\n=== CORRECTION TERMINÉE ===");
    
  } catch (err) {
    console.error("Erreur générale:", err.message);
  } finally {
    await sql.close();
  }
}

// Exécuter la correction
fixDataSynchronization().catch(console.error);