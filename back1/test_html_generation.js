// Test de la génération HTML du devis
const express = require("express");
const nodemailer = require("nodemailer");

// Configuration email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'abderrahmenhailane@gmail.com',
    pass: 'npxn feww ajbk bfwl'
  }
});

// Données de test d'un devis
const testDevis = {
  reference: "TEST-001",
  date: "2025-01-15",
  destinataire: "M. Test Client",
  societe: "Entreprise Test",
  telephone: "0123456789",
  vRef: "REF-001",
  objet: "Prestation de test",
  elements: [
    {
      type: "section",
      data: { description: "Contrôle Qualité - HSE" }
    },
    {
      type: "sousSection",
      data: { description: "Inspection visuelle" },
      parentSection: { description: "Contrôle Qualité - HSE" }
    },
    {
      type: "item",
      data: { description: "Vérification des soudures" },
      parentSection: { description: "Contrôle Qualité - HSE" }
    },
    {
      type: "section",
      data: { description: "Bordereau de prix" }
    },
    {
      type: "sousSection",
      data: { description: "Prestation de contrôle" },
      parentSection: { description: "Bordereau de prix" },
      unite: "M²",
      priceData: { qt: 100, pu: 25 }
    }
  ]
};

// Fonction pour générer le HTML du devis (copiée du backend)
function generateDevisHTML(devis) {
  const brandBlue = "0B3B7A";
  
  // Fonction helper pour créer des paragraphes
  function createParagraph(text, options = {}) {
    let style = '';
    if (options.marginTop) style += `margin-top: ${options.marginTop}px;`;
    if (options.marginBottom) style += `margin-bottom: ${options.marginBottom}px;`;
    if (options.marginLeft) style += `margin-left: ${options.marginLeft}px;`;
    if (options.color) style += `color: #${options.color};`;
    if (options.italic) style += 'font-style: italic;';
    if (options.bold) style += 'font-weight: bold;';
    if (options.fontSize) style += `font-size: ${options.fontSize}px;`;
    
    return `<p style="${style}">${text}</p>`;
  }

  // Générer le contenu des sections
  function generateSectionContent(element) {
    const getSectionType = (el) => { 
      if (el.type === 'section') return el.data?.description || ''; 
      if (el.parentSection) return el.parentSection.description || ''; 
      return ''; 
    };
    const sectionType = getSectionType(element);

    if (sectionType.includes('Contrôle Qualité') || sectionType.includes('HSE')) {
      if (element.type === 'section') {
        return `<h4 style="color: #${brandBlue}; font-weight: bold; font-size: 18px; border-bottom: 2px solid #${brandBlue}; margin: 25px 0 10px 0; padding-bottom: 6px;">${element.data?.description || ''}</h4>`;
      }
      if (element.type === 'sousSection') {
        return createParagraph(`• ${element.data?.description || ''}`, { marginLeft: 20, marginTop: 10 });
      }
      if (element.type === 'item') {
        return createParagraph(`- ${element.data?.description || ''}`, { marginLeft: 40, marginTop: 5 });
      }
    } else if (sectionType.includes('Bordereau de prix') || sectionType.includes('Prix')) {
      if (element.type === 'section') {
        return `<h4 style="color: #${brandBlue}; font-weight: bold; font-size: 18px; margin: 25px 0 10px 0;">${element.data?.description || ''}</h4>`;
      }
    }
    return '';
  }

  // Calculer le nombre de pages (estimation)
  const estimatedPages = Math.max(1, Math.ceil((devis.elements?.length || 0) / 10));

  // Générer le HTML complet
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 14px; color: #111; margin: 0; padding: 20px; background: #fff; }
        .devis-container { max-width: 800px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        td, th { border: 1px solid #000; padding: 8px; vertical-align: middle; background: #fff; }
        .offre { background: #${brandBlue} !important; color: #fff !important; font-weight: 700 !important; text-align: center !important; }
        .gr { font-weight: 700 !important; color: #${brandBlue} !important; }
        .p1 { font-weight: 700 !important; color: #${brandBlue} !important; }
        h4 { margin: 25px 0 10px 0; padding-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="devis-container">
        <table>
          <tr>
            <td style="font-weight: 700; font-size: 14px;">Date</td>
            <td style="font-size: 14px;">${devis.date || new Date().toISOString().split('T')[0]}</td>
            <td colspan="2" class="offre" style="font-size: 16px;">OFFRE DE PRIX</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 14px;">Nombre de pages (celle-ci comprise)</td>
            <td style="font-size: 13px;">${estimatedPages}</td>
            <td class="gr" style="font-size: 14px;">N/Réf.</td>
            <td class="p1" style="text-align: center; font-size: 14px;">${devis.reference || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 14px;">Destinataire</td>
            <td colspan="3" style="font-size: 13px;">${devis.destinataire || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 14px;">Société</td>
            <td colspan="3" style="font-size: 13px;">${devis.societe || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 14px;">Tél</td>
            <td colspan="3" style="font-size: 13px;">${devis.telephone || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 14px;">V/Réf.</td>
            <td colspan="3" style="font-size: 13px;">${devis.vRef || ''}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 14px;">Objet</td>
            <td colspan="3" style="font-size: 13px;">${devis.objet || ''}</td>
          </tr>
        </table>
        
        ${createParagraph('Monsieur,', { marginTop: 20, marginBottom: 10 })}
        ${createParagraph("Suite à votre demande, nous vous communiquons ci-après nos meilleures conditions pour la réalisation des prestations citées en objet.", { marginLeft: 20, marginBottom: 20 })}
        
        ${(devis.elements || []).map(el => generateSectionContent(el)).join('')}
        
        ${createParagraph("Nous restons à votre entière disposition pour tout renseignement complémentaire et vous prions d'agréer, Monsieur, nos meilleures salutations.", { marginTop: 20, marginBottom: 10 })}
      </div>
    </body>
    </html>
  `;

  return html;
}

// Test de la génération HTML
async function testHTMLGeneration() {
  try {
    console.log('=== TEST DE GÉNÉRATION HTML ===');
    
    // Générer le HTML
    const htmlContent = generateDevisHTML(testDevis);
    console.log('✅ HTML généré avec succès');
    console.log(`📏 Taille du HTML: ${htmlContent.length} caractères`);
    
    // Sauvegarder le HTML dans un fichier pour vérification
    const fs = require('fs');
    fs.writeFileSync('test_devis.html', htmlContent);
    console.log('💾 HTML sauvegardé dans test_devis.html');
    
    // Test d'envoi d'email avec le HTML
    console.log('\n=== TEST D\'ENVOI D\'EMAIL ===');
    
    const mailOptions = {
      from: 'abderrahmenhailane@gmail.com',
      to: 'abderrahmenhailane@gmail.com',
      subject: 'Test - Devis HTML généré',
      html: `
        <h2>Test de génération HTML</h2>
        <p>Le HTML du devis a été généré avec succès.</p>
        <p><strong>Référence :</strong> ${testDevis.reference}</p>
        <p><strong>Nombre d'éléments :</strong> ${testDevis.elements.length}</p>
        <hr>
        <h3>Aperçu du devis généré :</h3>
        ${htmlContent}
      `,
      attachments: [
        {
          filename: 'devis_test.html',
          content: htmlContent,
          contentType: 'text/html'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testHTMLGeneration(); 