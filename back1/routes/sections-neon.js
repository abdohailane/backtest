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
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT sst.*, 
               (SELECT COUNT(*) FROM item_type it WHERE it.soussection_type_id = sst.id) as items_count
        FROM sous_section_type sst 
        WHERE sst.section_type_id = $1
        ORDER BY sst.id
      `, [req.params.sectionTypeId]);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des sous-sections:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les items d'une sous-section
router.get("/sous-sections/:sousSectionTypeId/items", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT it.*, 
               (SELECT COUNT(*) FROM sous_item_type sit WHERE sit.item_type_id = it.id) as sous_items_count
        FROM item_type it 
        WHERE it.soussection_type_id = $1
        ORDER BY it.id
      `, [req.params.sousSectionTypeId]);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des items:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les sous-items d'un item
router.get("/items/:itemTypeId/sous-items", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT sit.*
        FROM sous_item_type sit 
        WHERE sit.item_type_id = $1
        ORDER BY sit.id
      `, [req.params.itemTypeId]);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des sous-items:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter une section à un devis
router.post("/devis/:devisId", auth, async (req, res) => {
  const { section_type_id, order } = req.body;
  
  try {
    const client = await pool.connect();
    try {
      // Vérifier que le devis existe
      const devisCheck = await client.query('SELECT id FROM devis WHERE id = $1', [req.params.devisId]);
      
      if (devisCheck.rows.length === 0) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }

      const result = await client.query(
        'INSERT INTO section_instance (devis_id, section_type_id, ordre) VALUES ($1, $2, $3) RETURNING id',
        [req.params.devisId, section_type_id, order]
      );
      
      res.status(201).json({ 
        message: "Section ajoutée avec succès", 
        id: result.rows[0].id 
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de l'ajout de la section:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer la structure complète d'un devis
router.get("/devis/:devisId/structure", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Vérifier que le devis existe
      const devisCheck = await client.query('SELECT id FROM devis WHERE id = $1', [req.params.devisId]);
      
      if (devisCheck.rows.length === 0) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }

      // Récupérer toutes les sections du devis
      const sections = await client.query(`
        SELECT si.id, si.ordre, st.description
        FROM section_instance si
        JOIN section_type st ON si.section_type_id = st.id
        WHERE si.devis_id = $1
        ORDER BY si.ordre
      `, [req.params.devisId]);

      // Pour chaque section, récupérer ses sous-sections
      for (let section of sections.rows) {
        const sousSections = await client.query(`
          SELECT ssi.id, ssi.ordre, sst.description
          FROM sous_section_instance ssi
          JOIN sous_section_type sst ON ssi.soussection_type_id = sst.id
          WHERE ssi.section_instance_id = $1
          ORDER BY ssi.ordre
        `, [section.id]);
        
        section.sous_sections = sousSections.rows;

        // Pour chaque sous-section, récupérer ses items
        for (let sousSection of section.sous_sections) {
          const items = await client.query(`
            SELECT ii.id, ii.ordre, ii.quantite, it.description
            FROM item_instance ii
            JOIN item_type it ON ii.item_type_id = it.id
            WHERE ii.soussection_instance_id = $1
            ORDER BY ii.ordre
          `, [sousSection.id]);
          
          sousSection.items = items.rows;
        }
      }

      res.json(sections.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la récupération de la structure:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer une section d'un devis
router.delete("/sections/:sectionInstanceId", auth, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Vérifier que la section existe
      const sectionCheck = await client.query(`
        SELECT si.id FROM section_instance si 
        JOIN devis d ON si.devis_id = d.id 
        WHERE si.id = $1
      `, [req.params.sectionInstanceId]);
      
      if (sectionCheck.rows.length === 0) {
        return res.status(404).json({ message: "Section non trouvée" });
      }

      await client.query('DELETE FROM section_instance WHERE id = $1', [req.params.sectionInstanceId]);
      
      res.json({ message: "Section supprimée avec succès" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Erreur lors de la suppression de la section:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;