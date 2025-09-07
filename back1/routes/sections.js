const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { pool } = require("../neon-db");

// Récupérer tous les types de sections disponibles
router.get("/types", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT st.*, 
               (SELECT COUNT(*) FROM sous_section_type sst WHERE sst.section_type_id = st.id) as sous_sections_count
        FROM section_type st 
        ORDER BY st.description
      `);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des types de sections:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les sous-sections d'un type de section
router.get("/types/:sectionTypeId/sous-sections", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT sst.*, 
             (SELECT COUNT(*) FROM ItemType it WHERE it.soussection_type_id = sst.id) as items_count
      FROM SousSectionType sst 
      WHERE sst.section_type_id = ${req.params.sectionTypeId}
      ORDER BY sst.id
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error("Erreur lors de la récupération des sous-sections:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les items d'une sous-section
router.get("/sous-sections/:sousSectionTypeId/items", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT it.*, 
             (SELECT COUNT(*) FROM SousItemType sit WHERE sit.item_type_id = it.id) as sous_items_count
      FROM ItemType it 
      WHERE it.soussection_type_id = ${req.params.sousSectionTypeId}
      ORDER BY it.id
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error("Erreur lors de la récupération des items:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les sous-items d'un item
router.get("/items/:itemTypeId/sous-items", auth, async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT sit.*
      FROM SousItemType sit 
      WHERE sit.item_type_id = ${req.params.itemTypeId}
      ORDER BY sit.id
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error("Erreur lors de la récupération des sous-items:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter une section à un devis
router.post("/devis/:devisId", auth, async (req, res) => {
  const { section_type_id, order } = req.body;
  
  try {
    await sql.connect(config);
    
    // Vérifier que le devis existe
    const devisCheck = await sql.query`
      SELECT id FROM Devis WHERE id = ${req.params.devisId}
    `;
    
    if (devisCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Devis non trouvé" });
    }

    const result = await sql.query`
      INSERT INTO SectionInstance (devis_id, section_type_id, ordre)
      OUTPUT INSERTED.id
      VALUES (${req.params.devisId}, ${section_type_id}, ${order})
    `;
    
    res.status(201).json({ 
      message: "Section ajoutée avec succès", 
      id: result.recordset[0].id 
    });
  } catch (err) {
    console.error("Erreur lors de l'ajout de la section:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter une sous-section à une section
router.post("/sections/:sectionInstanceId/sous-sections", auth, async (req, res) => {
  const { sous_section_type_id, order } = req.body;
  
  try {
    await sql.connect(config);
    
    // Vérifier que la section existe
    const sectionCheck = await sql.query`
      SELECT si.id FROM SectionInstance si 
      JOIN Devis d ON si.devis_id = d.id 
      WHERE si.id = ${req.params.sectionInstanceId}
    `;
    
    if (sectionCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Section non trouvée" });
    }

    const result = await sql.query`
      INSERT INTO SousSectionInstance (section_instance_id, soussection_type_id, ordre)
      OUTPUT INSERTED.id
      VALUES (${req.params.sectionInstanceId}, ${sous_section_type_id}, ${order})
    `;
    
    res.status(201).json({ 
      message: "Sous-section ajoutée avec succès", 
      id: result.recordset[0].id 
    });
  } catch (err) {
    console.error("Erreur lors de l'ajout de la sous-section:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter un item à une sous-section
router.post("/sous-sections/:sousSectionInstanceId/items", auth, async (req, res) => {
  const { item_type_id, order, quantite } = req.body;
  
  try {
    await sql.connect(config);
    
    // Vérifier que la sous-section existe
    const sousSectionCheck = await sql.query`
      SELECT ssi.id FROM SousSectionInstance ssi 
      JOIN SectionInstance si ON ssi.section_instance_id = si.id 
      JOIN Devis d ON si.devis_id = d.id 
      WHERE ssi.id = ${req.params.sousSectionInstanceId}
    `;
    
    if (sousSectionCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Sous-section non trouvée" });
    }

    const result = await sql.query`
      INSERT INTO ItemInstance (soussection_instance_id, item_type_id, ordre, quantite)
      OUTPUT INSERTED.id
      VALUES (${req.params.sousSectionInstanceId}, ${item_type_id}, ${order}, ${quantite})
    `;
    
    res.status(201).json({ 
      message: "Item ajouté avec succès", 
      id: result.recordset[0].id 
    });
  } catch (err) {
    console.error("Erreur lors de l'ajout de l'item:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer la structure complète d'un devis
router.get("/devis/:devisId/structure", auth, async (req, res) => {
  try {
    await sql.connect(config);
    
    // Vérifier que le devis existe
    const devisCheck = await sql.query`
      SELECT id FROM Devis WHERE id = ${req.params.devisId}
    `;
    
    if (devisCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Devis non trouvé" });
    }

    // Récupérer toutes les sections du devis
    const sections = await sql.query`
      SELECT si.id, si.ordre, st.description
      FROM SectionInstance si
      JOIN SectionType st ON si.section_type_id = st.id
      WHERE si.devis_id = ${req.params.devisId}
      ORDER BY si.ordre
    `;

    // Pour chaque section, récupérer ses sous-sections
    for (let section of sections.recordset) {
      const sousSections = await sql.query`
        SELECT ssi.id, ssi.ordre, sst.description
        FROM SousSectionInstance ssi
        JOIN SousSectionType sst ON ssi.soussection_type_id = sst.id
        WHERE ssi.section_instance_id = ${section.id}
        ORDER BY ssi.ordre
      `;
      
      section.sous_sections = sousSections.recordset;

      // Pour chaque sous-section, récupérer ses items
      for (let sousSection of section.sous_sections) {
        const items = await sql.query`
          SELECT ii.id, ii.ordre, ii.quantite, it.titre, it.unite, it.type_valeur
          FROM ItemInstance ii
          JOIN ItemType it ON ii.item_type_id = it.id
          WHERE ii.soussection_instance_id = ${sousSection.id}
          ORDER BY ii.ordre
        `;
        
        sousSection.items = items.recordset;
      }
    }

    res.json(sections.recordset);
  } catch (err) {
    console.error("Erreur lors de la récupération de la structure:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer une section d'un devis
router.delete("/sections/:sectionInstanceId", auth, async (req, res) => {
  try {
    await sql.connect(config);
    
    // Vérifier que la section existe
    const sectionCheck = await sql.query`
      SELECT si.id FROM SectionInstance si 
      JOIN Devis d ON si.devis_id = d.id 
      WHERE si.id = ${req.params.sectionInstanceId}
    `;
    
    if (sectionCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Section non trouvée" });
    }

    await sql.query`DELETE FROM SectionInstance WHERE id = ${req.params.sectionInstanceId}`;
    
    res.json({ message: "Section supprimée avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression de la section:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router; 