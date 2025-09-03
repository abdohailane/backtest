const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sql, config } = require("../db");
const nodemailer = require("nodemailer");

// Configuration email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'abderrahmenhailane@gmail.com',
    pass: process.env.EMAIL_PASS || 'npxn feww ajbk bfwl'
  }
});

// Liste des devis
router.get("/", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT d.*, c.nom_entreprise, c.contact, u.nom as user_name 
      FROM Devis d 
      LEFT JOIN Client c ON d.client_id = c.id 
      LEFT JOIN [User] u ON d.user_id = u.id
      ORDER BY d.date_creation DESC
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error("Erreur lors de la récupération des devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Créer un nouveau devis
router.post("/", auth, async (req, res) => {
  const { 
    reference, 
    date, 
    destinataire, 
    societe, 
    telephone, 
    vRef, 
    objet, 
    nombrePages,
    client_id,
    elements,
    remarques,
    unites,
    priceData,
    sousSectionValues
  } = req.body;

  try {
    await sql.connect(config);
    
    // Vérifier d'abord si les colonnes existent
    let hasNewColumns = false;
    try {
      await sql.query`SELECT status, remarques, unites, priceData, sousSectionValues FROM Devis WHERE 1=0`;
      hasNewColumns = true;
    } catch (columnError) {
      console.log('Colonnes manquantes détectées, utilisation de l\'ancien schéma');
      hasNewColumns = false;
    }
    
    let result;
    if (hasNewColumns) {
      // Utiliser le nouveau schéma avec toutes les colonnes
      result = await sql.query`
        INSERT INTO Devis (
          reference, 
          date, 
          destinataire, 
          societe, 
          telephone, 
          vRef, 
          objet, 
          nombrePages,
          client_id,
          user_id,
          date_creation,
          elements,
          remarques,
          unites,
          priceData,
          sousSectionValues,
          status
        )
        OUTPUT INSERTED.id
        VALUES (
          ${reference}, 
          ${date}, 
          ${destinataire}, 
          ${societe}, 
          ${telephone}, 
          ${vRef}, 
          ${objet}, 
          ${nombrePages},
          ${client_id},
          ${req.user.id},
          GETDATE(),
          ${JSON.stringify(elements) || null},
          ${JSON.stringify(remarques) || null},
          ${JSON.stringify(unites) || null},
          ${JSON.stringify(priceData) || null},
          ${JSON.stringify(sousSectionValues) || null},
          'non envoyé'
        )
      `;
    } else {
      // Utiliser l'ancien schéma sans les nouvelles colonnes
      result = await sql.query`
        INSERT INTO Devis (
          reference, 
          date, 
          destinataire, 
          societe, 
          telephone, 
          vRef, 
          objet, 
          nombrePages,
          client_id,
          user_id,
          date_creation,
          elements
        )
        OUTPUT INSERTED.id
        VALUES (
          ${reference}, 
          ${date}, 
          ${destinataire}, 
          ${societe}, 
          ${telephone}, 
          ${vRef}, 
          ${objet}, 
          ${nombrePages},
          ${client_id},
          ${req.user.id},
          GETDATE(),
          ${JSON.stringify(elements) || null}
        )
      `;
    }
    
    res.status(201).json({ 
      message: "Devis créé avec succès", 
      id: result.recordset[0].id 
    });
  } catch (err) {
    console.error("Erreur lors de la création du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer un devis par ID
router.get("/:id", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT d.*, c.nom_entreprise, c.contact, c.telephone as client_telephone, c.email, u.nom as user_name
      FROM Devis d 
      LEFT JOIN Client c ON d.client_id = c.id 
      LEFT JOIN [User] u ON d.user_id = u.id
      WHERE d.id = ${req.params.id}
    `;
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Devis non trouvé" });
    }
    const devis = result.recordset[0];
    if (devis.elements) {
      try {
        devis.elements = JSON.parse(devis.elements);
      } catch (e) {
        devis.elements = [];
      }
    }
    if (devis.remarques) {
      try {
        devis.remarques = JSON.parse(devis.remarques);
      } catch (e) {
        devis.remarques = {};
      }
    }
    if (devis.unites) {
      try {
        devis.unites = JSON.parse(devis.unites);
      } catch (e) {
        devis.unites = {};
      }
    }
    if (devis.priceData) {
      try {
        devis.priceData = JSON.parse(devis.priceData);
      } catch (e) {
        devis.priceData = {};
      }
    }
    if (devis.sousSectionValues) {
      try {
        devis.sousSectionValues = JSON.parse(devis.sousSectionValues);
      } catch (e) {
        devis.sousSectionValues = {};
      }
    }
    res.json(devis);
  } catch (err) {
    console.error("Erreur lors de la récupération du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier un devis
router.put("/:id", auth, async (req, res) => {
  const { 
    reference, 
    date, 
    destinataire, 
    societe, 
    telephone, 
    vRef, 
    objet, 
    nombrePages,
    client_id,
    elements,
    remarques,
    unites,
    priceData,
    sousSectionValues
  } = req.body;

  try {
    await sql.connect(config);
    
    // Vérifier d'abord si les colonnes existent
    let hasNewColumns = false;
    try {
      await sql.query`SELECT status, remarques, unites, priceData, sousSectionValues FROM Devis WHERE 1=0`;
      hasNewColumns = true;
    } catch (columnError) {
      console.log('Colonnes manquantes détectées, utilisation de l\'ancien schéma');
      hasNewColumns = false;
    }
    
    if (hasNewColumns) {
      // Utiliser le nouveau schéma avec toutes les colonnes
      await sql.query`
        UPDATE Devis SET
          reference = ${reference},
          date = ${date},
          destinataire = ${destinataire},
          societe = ${societe},
          telephone = ${telephone},
          vRef = ${vRef},
          objet = ${objet},
          nombrePages = ${nombrePages},
          client_id = ${client_id},
          elements = ${JSON.stringify(elements) || null},
          remarques = ${JSON.stringify(remarques) || null},
          unites = ${JSON.stringify(unites) || null},
          priceData = ${JSON.stringify(priceData) || null},
          sousSectionValues = ${JSON.stringify(sousSectionValues) || null},
          date_modification = GETDATE()
        WHERE id = ${req.params.id}
      `;
    } else {
      // Utiliser l'ancien schéma sans les nouvelles colonnes
      await sql.query`
        UPDATE Devis SET
          reference = ${reference},
          date = ${date},
          destinataire = ${destinataire},
          societe = ${societe},
          telephone = ${telephone},
          vRef = ${vRef},
          objet = ${objet},
          nombrePages = ${nombrePages},
          client_id = ${client_id},
          elements = ${JSON.stringify(elements) || null},
          date_modification = GETDATE()
        WHERE id = ${req.params.id}
      `;
    }
    
    res.json({ message: "Devis modifié avec succès" });
  } catch (err) {
    console.error("Erreur lors de la modification du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer un devis
router.delete("/:id", auth, async (req, res) => {
  try {
    await sql.connect(config);
    await sql.query`DELETE FROM Devis WHERE id = ${req.params.id}`;
    res.json({ message: "Devis supprimé avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression du devis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Générer un PDF d'un devis
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT d.*, c.nom_entreprise, c.contact, c.telephone as client_telephone, c.email, u.nom as user_name
      FROM Devis d 
      LEFT JOIN Client c ON d.client_id = c.id 
      LEFT JOIN [User] u ON d.user_id = u.id
      WHERE d.id = ${req.params.id}
    `;
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Devis non trouvé" });
    }
    
    const devis = result.recordset[0];
    if (devis.elements) {
      try {
        devis.elements = JSON.parse(devis.elements);
      } catch (e) {
        devis.elements = [];
      }
    }
    
    // Récupérer les données supplémentaires nécessaires pour la génération PDF
    // Vérifier d'abord si les colonnes existent
    let devisData = { recordset: [] };
    try {
      devisData = await sql.query`
        SELECT remarques, unites, priceData, sousSectionValues
        FROM Devis 
        WHERE id = ${req.params.id}
      `;
    } catch (columnError) {
      console.log('Colonnes manquantes détectées, utilisation de valeurs par défaut:', columnError.message);
      // Si les colonnes n'existent pas, utiliser des valeurs par défaut
      devisData = { recordset: [{ remarques: null, unites: null, priceData: null, sousSectionValues: null }] };
    }
    
    if (devisData.recordset.length > 0) {
      const additionalData = devisData.recordset[0];
      if (additionalData.remarques) {
        try {
          devis.remarques = JSON.parse(additionalData.remarques);
        } catch (e) {
          devis.remarques = {};
        }
      }
      if (additionalData.unites) {
        try {
          devis.unites = JSON.parse(additionalData.unites);
        } catch (e) {
          devis.unites = {};
        }
      }
      if (additionalData.priceData) {
        try {
          devis.priceData = JSON.parse(additionalData.priceData);
        } catch (e) {
          devis.priceData = {};
        }
      }
      if (additionalData.sousSectionValues) {
        try {
          devis.sousSectionValues = JSON.parse(additionalData.sousSectionValues);
        } catch (e) {
          devis.sousSectionValues = {};
        }
      }
    }
    
    console.log('Génération du PDF en cours...');
    
    // Générer le PDF
    const pdfBuffer = await generatePDFBuffer(devis);
    
    console.log(`PDF généré, taille: ${pdfBuffer.length} bytes`);
    
    // Définir les headers pour le téléchargement du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="devis_${devis.reference}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Envoyer le PDF
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Erreur lors de la génération du PDF:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Envoyer le devis par mail
router.post("/:id/send-email", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT d.*, c.nom_entreprise, c.contact, c.telephone as client_telephone, c.email, u.nom as user_name
      FROM Devis d 
      LEFT JOIN Client c ON d.client_id = c.id 
      LEFT JOIN [User] u ON d.user_id = u.id
      WHERE d.id = ${req.params.id}
    `;
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Devis non trouvé" });
    }
    
    const devis = result.recordset[0];
    if (devis.elements) {
      try {
        devis.elements = JSON.parse(devis.elements);
      } catch (e) {
        devis.elements = [];
      }
    }

    // Extraire les données directement depuis les éléments (comme dans le frontend)
    if (devis.elements && Array.isArray(devis.elements)) {
      // Initialiser les objets pour stocker les données extraites
      devis.remarques = { sections: {}, sousSections: {}, items: {}, sousItems: {} };
      devis.unites = {};
      devis.priceData = {};
      devis.sousSectionValues = {};
      
      devis.elements.forEach(element => {
        if (!element || !element.type || !element.data) return;
        
        const id = element.data.id;
        
        // Extraire les remarques
        if (element.remarque) {
          if (element.type === 'section') devis.remarques.sections[id] = element.remarque;
          if (element.type === 'sousSection') devis.remarques.sousSections[id] = element.remarque;
          if (element.type === 'item') devis.remarques.items[id] = element.remarque;
          if (element.type === 'sousItem') devis.remarques.sousItems[id] = element.remarque;
        }
        
                 // Extraire les unités (pour les sous-items ET les sous-sections)
         if ((element.type === 'sousItem' || element.type === 'sousSection') && (element.unite || element.unite === 0)) {
           devis.unites[id] = element.unite;
         }
        
        // Extraire les valeurs des sous-sections spéciales
        if (element.type === 'sousSection' && (element.value || element.value === 0)) {
          devis.sousSectionValues[id] = element.value;
        }
        
        // Extraire les données de prix
        if (element.type === 'sousSection' && element.priceData) {
          devis.priceData[id] = element.priceData;
        }
      });
    }

    // Vérifier que le client a un email
    if (!devis.email) {
      return res.status(400).json({ message: "Le client n'a pas d'email configuré. Veuillez d'abord configurer l'email du client." });
    }

    console.log('Génération du PDF en cours...');
    
    let pdfBuffer;
    let attachmentName;
    let contentType;
    
    try {
      // Essayer de générer le PDF
      pdfBuffer = await generatePDFBuffer(devis);
      attachmentName = `devis_${devis.reference}.pdf`;
      contentType = 'application/pdf';
      console.log(`PDF généré, taille: ${pdfBuffer.length} bytes`);
    } catch (pdfError) {
      console.error('Erreur lors de la génération PDF, utilisation du HTML comme fallback:', pdfError.message);
      // Fallback: utiliser le HTML si le PDF échoue
      const htmlContent = generateDevisHTML(devis);
      pdfBuffer = Buffer.from(htmlContent, 'utf8');
      attachmentName = `devis_${devis.reference}.html`;
      contentType = 'text/html';
      console.log(`HTML généré comme fallback, taille: ${pdfBuffer.length} bytes`);
    }
    
         // Envoyer l'email avec le PDF ou HTML en pièce jointe (sans tracking)
     const mailOptions = {
       from: process.env.EMAIL_USER || 'abderrahmenhailane@gmail.com',
       to: devis.email,
       subject: `Devis ${devis.reference} - ${devis.objet}`,
       html: `
         <h2>Bonjour ${devis.destinataire || devis.contact},</h2>
         <p>Veuillez trouver ci-joint notre devis ${devis.reference} pour ${devis.objet}.</p>
         <p><strong>Référence :</strong> ${devis.reference}</p>
         <p><strong>Date :</strong> ${devis.date}</p>
         <p><strong>Objet :</strong> ${devis.objet}</p>
         <p><strong>Société :</strong> ${devis.societe}</p>
         <br>
         <p>Nous restons à votre disposition pour toute question.</p>
         <p>Cordialement,<br>L'équipe commerciale</p>
       `,
      attachments: [
        {
          filename: attachmentName,
          content: pdfBuffer,
          contentType: contentType
        }
      ]
    };

    console.log('Envoi de l\'email en cours...');
    
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email envoyé avec succès');
      
      // Mettre à jour le statut du devis
      await sql.query`
        UPDATE Devis 
        SET status = 'envoyé', 
            email_sent_at = GETDATE()
        WHERE id = ${devis.id}
      `;
      
      res.json({ message: "Devis envoyé par email avec succès" });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      
      // Détails de l'erreur pour le debugging
      let errorMessage = "Erreur lors de l'envoi de l'email";
      if (emailError.code === 'EAUTH') {
        errorMessage = "Erreur d'authentification email. Vérifiez la configuration Gmail.";
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage = "Erreur de connexion au serveur email.";
      } else if (emailError.code === 'ETIMEDOUT') {
        errorMessage = "Délai d'attente dépassé pour l'envoi d'email.";
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: emailError.message,
        code: emailError.code
      });
    }
  } catch (err) {
    console.error("Erreur générale lors de l'envoi du devis par email:", err);
    res.status(500).json({ 
      message: "Erreur lors de l'envoi de l'email",
      error: err.message
    });
  }
});

// Fonction pour générer le HTML du devis (adaptée du frontend)
function generateDevisHTML(devis) {
  const brandBlue = "0B3B7A";
  
  // Fonction pour formater la date
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
  
  // Fonction helper pour créer des cellules de tableau
  function createTableCell(content, options = {}) {
    let cell = `<td`;
    if (options.colSpan) cell += ` colspan="${options.colSpan}"`;
    if (options.rowSpan) cell += ` rowspan="${options.rowSpan}"`;
    if (options.className) cell += ` class="${options.className}"`;
    
    let style = '';
    if (options.bold) style += 'font-weight: 700;';
    if (options.color) style += `color: #${options.color};`;
    if (options.bgColor) style += `background-color: #${options.bgColor};`;
    if (options.textAlign) style += `text-align: ${options.textAlign};`;
    if (options.fontSize) style += `font-size: ${options.fontSize}px;`;
    
    if (style) cell += ` style="${style}"`;
    cell += `>${content || ''}</td>`;
    return cell;
  }

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
        let html = `<h4 style="color: #${brandBlue}; font-weight: bold; font-size: 18px; border-bottom: 1px solid #${brandBlue}; margin: 25px 0 10px 0; padding-bottom: 6px;">${element.data?.description || ''}</h4>`;
        // Ajouter la remarque de section si elle existe
        if (devis.remarques?.sections?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sections[element.data.id]}`, { marginTop: 10, color: "d32f2f", italic: true });
        }
        return html;
      }
      if (element.type === 'sousSection') {
        let html = createParagraph(`• ${element.data?.description || ''}`, { marginLeft: 20, marginTop: 10 });
        // Ajouter la remarque de sous-section si elle existe
        if (devis.remarques?.sousSections?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sousSections[element.data.id]}`, { marginLeft: 20, color: "d32f2f", italic: true });
        }
        return html;
      }
      if (element.type === 'item') {
        let html = createParagraph(`- ${element.data?.description || ''}`, { marginLeft: 40, marginTop: 5 });
        // Ajouter la remarque d'item si elle existe
        if (devis.remarques?.items?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.items[element.data.id]}`, { marginLeft: 40, color: "d32f2f", italic: true });
        }
        return html;
      }
      if (element.type === 'sousItem') {
        const unite = element.unite ? ` .................................................... ${element.unite} µm` : '';
        let html = createParagraph(`-- ${element.data?.description || ''}${unite}`, { marginLeft: 60, marginTop: 3 });
        // Ajouter la remarque de sous-item si elle existe
        if (devis.remarques?.sousItems?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sousItems[element.data.id]}`, { marginLeft: 60, color: "d32f2f", italic: true });
        }
        return html;
      }
    } else if (sectionType.includes('Bordereau de prix') || sectionType.includes('Prix')) {
      if (element.type === 'section') {
        let html = `<h4 style="color: #${brandBlue}; font-weight: bold; font-size: 18px; border-bottom: 1px solid #${brandBlue}; margin: 25px 0 10px 0; padding-bottom: 6px;">${element.data?.description || ''}</h4>`;
                 // Générer le tableau de prix complet
         const prixSousSections = devis.elements?.filter(el => 
           el.type === 'sousSection' && 
           el.parentSection && 
           el.parentSection.description && 
           (el.parentSection.description.includes('Bordereau de prix') || el.parentSection.description.includes('Prix'))
         ) || [];

         html += `
           <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000;">
           <thead>
             <tr style="background-color: #${brandBlue}; ">
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
    // Récupérer correctement l’ID
    const id = sousSection.data?.id || sousSection.id;
    const priceInfo = devis.priceData?.[id] || {};

    const qt = Number(priceInfo.qt || 0);
    const pu = Number(priceInfo.pu || 0);
    const total = qt * pu;

    html += `
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">${sousSection.data?.description || sousSection.description || ''}</td>
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

        
        // Ajouter la remarque de section si elle existe
        if (devis.remarques?.sections?.[element.data?.id]) {
          html += createParagraph(`(*) ${devis.remarques.sections[element.data.id]}`, { marginTop: 10, marginLeft: 15, italic: true });
        }
        
        return html;
      }
    } else if (sectionType.includes('Délai de réalisation') || sectionType.includes('Conditions de paiement') || sectionType.includes("Validité de l'offre")) {
      if (element.type === 'section') {
        let html = `<h4 style="color: #${brandBlue}; font-weight: bold; font-size: 18px; border-bottom: 1px solid #${brandBlue}; margin: 25px 0 10px 0; padding-bottom: 6px;">${element.data?.description || ''}</h4>`;
        // Ajouter la remarque de section si elle existe
        if (devis.remarques?.sections?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sections[element.data.id]}`, { marginTop: 10, color: "d32f2f", italic: true });
        }
        return html;
      }
      if (element.type === 'sousSection') {
        const value = element.value || devis.sousSectionValues?.[element.data?.id] || '';
        let html = createParagraph(`• ${element.data?.description || ''} :${value};`, { marginLeft: 20, marginTop: 10 });
        // Ajouter la remarque de sous-section si elle existe
        if (devis.remarques?.sousSections?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sousSections[element.data.id]}`, { marginLeft: 20, color: "d32f2f", italic: true });
        }
        return html;
      }
    } else {
      if (element.type === 'section') {
        let html = `<h4 style="color: #${brandBlue}; font-weight: bold; font-size: 18px; border-bottom: 1px solid #${brandBlue}; margin: 25px 0 10px 0; padding-bottom: 6px;">${element.data?.description || ''}</h4>`;
        // Ajouter la remarque de section si elle existe
        if (devis.remarques?.sections?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sections[element.data.id]}`, { marginTop: 10, color: "d32f2f", italic: true });
        }
        return html;
      }
      if (element.type === 'sousSection') {
        const isChargeSection = element.data?.description?.includes('À notre charge') || element.data?.description?.includes('À votre charge');
        let html = '';
        if (isChargeSection) { 
          html = createParagraph(element.data.description, { marginTop: 40, bold: true}); 
        } else { 
          html = createParagraph(`➤ ${element.data?.description || ''}`, { marginTop: 10, color: brandBlue}); 
        }
        // Ajouter la remarque de sous-section si elle existe
        if (devis.remarques?.sousSections?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sousSections[element.data.id]}`, { marginTop: 5, color: "d32f2f", italic: true });
        }
        return html;
      }
      if (element.type === 'item') {
        let html = createParagraph(`● ${element.data?.description || ''}`, { marginLeft: 20, marginTop: 5 });
        // Ajouter la remarque d'item si elle existe
        if (devis.remarques?.items?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.items[element.data.id]}`, { marginLeft: 20, color: "d32f2f", italic: true });
        }
        return html;
      }
      if (element.type === 'sousItem') {
        const unite = element.unite ? ` .............................................. ${element.unite} µm` : '';
        let html = createParagraph(`- ${element.data?.description || ''}${unite}`, { marginLeft: 40, marginTop: 3 });
        // Ajouter la remarque de sous-item si elle existe
        if (devis.remarques?.sousItems?.[element.data?.id]) {
          html += createParagraph(`Remarque: ${devis.remarques.sousItems[element.data.id]}`, { marginLeft: 40, color: "d32f2f", italic: true });
        }
        return html;
      }
    }
    return '';
  }

  // Récupérer le nombre de pages directement depuis le devis
  const nombrePages = devis.nombrePages || 1;

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
            <td style="font-size: 14px;">${formatDate(devis.date)}</td>
            <td colspan="2" class="offre" style="font-size: 16px;">OFFRE DE PRIX</td>
          </tr>
                     <tr>
             <td style="font-weight: 700; font-size: 14px;">Nombre de pages (celle-ci comprise)</td>
             <td style="font-size: 13px;">${nombrePages}</td>
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

// Fonction pour générer le PDF en buffer
async function generatePDFBuffer(devis) {
  try {
    // Vérifier si puppeteer est disponible
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (err) {
      console.log('Puppeteer non installé, utilisation du HTML brut');
      // Si puppeteer n'est pas installé, on retourne le HTML comme fallback
      const htmlContent = generateDevisHTML(devis);
      return Buffer.from(htmlContent, 'utf8');
    }

    // Générer le HTML du devis
    const htmlContent = generateDevisHTML(devis);
    
    // Lancer le navigateur
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Définir le contenu HTML
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Générer le PDF
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });
    
    await browser.close();
    return pdfBuffer;
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    
    // Fallback: retourner le HTML si la génération PDF échoue
    try {
      const htmlContent = generateDevisHTML(devis);
      return Buffer.from(htmlContent, 'utf8');
    } catch (fallbackError) {
      console.error('Erreur lors du fallback HTML:', fallbackError);
      throw new Error('Impossible de générer le PDF ou le HTML');
    }
  }
}

module.exports = router; 