// Script de migration des données de SQL Server vers Supabase
const sql = require("mssql");
const { supabase } = require("./supabase-config");
require("dotenv").config();

// Configuration SQL Server (ancienne base)
const sqlConfig = {
  user: process.env.DB_USER || "devis",
  password: process.env.DB_PASSWORD || "abdoabdo",
  server: process.env.DB_SERVER || "STG-SB3",
  database: process.env.DB_DATABASE || "gestion_devis",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    trustedConnection: true,
    enableArithAbort: true,
    instanceName: "SQLEXPRESS"
  },
  port: 1433
};

async function migrateData() {
  try {
    console.log("🚀 Début de la migration vers Supabase...");
    
    // Connexion à SQL Server
    const pool = await sql.connect(sqlConfig);
    console.log("✅ Connecté à SQL Server");
    
    // Migration des clients
    console.log("📦 Migration des clients...");
    const clientsResult = await pool.request().query("SELECT * FROM client");
    for (const client of clientsResult.recordset) {
      try {
        const { error } = await supabase
          .from('client')
          .upsert({
            id: client.id,
            nom_entreprise: client.nom_entreprise,
            contact: client.contact,
            adresse: client.adresse,
            code_postal: client.code_postal,
            ville: client.ville,
            telephone: client.telephone,
            email: client.email,
            reference_client: client.reference_client
          });
        
        if (error) {
          console.error(`❌ Erreur migration client ${client.nom_entreprise}:`, error);
        } else {
          console.log(`✅ Client migré: ${client.nom_entreprise}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration client ${client.nom_entreprise}:`, err);
      }
    }
    
    // Migration des utilisateurs
    console.log("📦 Migration des utilisateurs...");
    const usersResult = await pool.request().query("SELECT * FROM [user]");
    for (const user of usersResult.recordset) {
      try {
        const { error } = await supabase
          .from('user')
          .upsert({
            id: user.id,
            nom: user.nom,
            email: user.email,
            mot_de_passe: user.mot_de_passe,
            role: user.role || 'employe',
            date_creation: user.date_creation
          });
        
        if (error) {
          console.error(`❌ Erreur migration utilisateur ${user.email}:`, error);
        } else {
          console.log(`✅ Utilisateur migré: ${user.email}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration utilisateur ${user.email}:`, err);
      }
    }
    
    // Migration des types de sections
    console.log("📦 Migration des types de sections...");
    const sectionTypesResult = await pool.request().query("SELECT * FROM section_type");
    for (const sectionType of sectionTypesResult.recordset) {
      try {
        const { error } = await supabase
          .from('section_type')
          .upsert({
            id: sectionType.id,
            description: sectionType.description
          });
        
        if (error) {
          console.error(`❌ Erreur migration type section ${sectionType.id}:`, error);
        } else {
          console.log(`✅ Type section migré: ${sectionType.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration type section ${sectionType.id}:`, err);
      }
    }
    
    // Migration des sous-types de sections
    console.log("📦 Migration des sous-types de sections...");
    const sousSectionTypesResult = await pool.request().query("SELECT * FROM sous_section_type");
    for (const sousSectionType of sousSectionTypesResult.recordset) {
      try {
        const { error } = await supabase
          .from('sous_section_type')
          .upsert({
            id: sousSectionType.id,
            section_type_id: sousSectionType.section_type_id,
            description: sousSectionType.description
          });
        
        if (error) {
          console.error(`❌ Erreur migration sous-type section ${sousSectionType.id}:`, error);
        } else {
          console.log(`✅ Sous-type section migré: ${sousSectionType.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration sous-type section ${sousSectionType.id}:`, err);
      }
    }
    
    // Migration des types d'items
    console.log("📦 Migration des types d'items...");
    const itemTypesResult = await pool.request().query("SELECT * FROM item_type");
    for (const itemType of itemTypesResult.recordset) {
      try {
        const { error } = await supabase
          .from('item_type')
          .upsert({
            id: itemType.id,
            soussection_type_id: itemType.soussection_type_id,
            description: itemType.description
          });
        
        if (error) {
          console.error(`❌ Erreur migration type item ${itemType.id}:`, error);
        } else {
          console.log(`✅ Type item migré: ${itemType.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration type item ${itemType.id}:`, err);
      }
    }
    
    // Migration des devis
    console.log("📦 Migration des devis...");
    const devisResult = await pool.request().query("SELECT * FROM devis");
    for (const devis of devisResult.recordset) {
      try {
        const { error } = await supabase
          .from('devis')
          .upsert({
            id: devis.id,
            reference: devis.reference,
            date: devis.date,
            destinataire: devis.destinataire,
            societe: devis.societe,
            telephone: devis.telephone,
            v_ref: devis.v_ref,
            objet: devis.objet,
            nombre_pages: devis.nombre_pages || 1,
            client_id: devis.client_id,
            user_id: devis.user_id,
            date_creation: devis.date_creation,
            date_modification: devis.date_modification,
            elements: devis.elements,
            status: devis.status,
            email_sent_at: devis.email_sent_at
          });
        
        if (error) {
          console.error(`❌ Erreur migration devis ${devis.reference}:`, error);
        } else {
          console.log(`✅ Devis migré: ${devis.reference}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration devis ${devis.reference}:`, err);
      }
    }
    
    // Migration des instances de sections
    console.log("📦 Migration des instances de sections...");
    const sectionInstancesResult = await pool.request().query("SELECT * FROM section_instance");
    for (const sectionInstance of sectionInstancesResult.recordset) {
      try {
        const { error } = await supabase
          .from('section_instance')
          .upsert({
            id: sectionInstance.id,
            devis_id: sectionInstance.devis_id,
            section_type_id: sectionInstance.section_type_id,
            ordre: sectionInstance.ordre
          });
        
        if (error) {
          console.error(`❌ Erreur migration instance section ${sectionInstance.id}:`, error);
        } else {
          console.log(`✅ Instance section migrée: ${sectionInstance.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration instance section ${sectionInstance.id}:`, err);
      }
    }
    
    // Migration des instances de sous-sections
    console.log("📦 Migration des instances de sous-sections...");
    const sousSectionInstancesResult = await pool.request().query("SELECT * FROM sous_section_instance");
    for (const sousSectionInstance of sousSectionInstancesResult.recordset) {
      try {
        const { error } = await supabase
          .from('sous_section_instance')
          .upsert({
            id: sousSectionInstance.id,
            section_instance_id: sousSectionInstance.section_instance_id,
            soussection_type_id: sousSectionInstance.soussection_type_id,
            ordre: sousSectionInstance.ordre
          });
        
        if (error) {
          console.error(`❌ Erreur migration instance sous-section ${sousSectionInstance.id}:`, error);
        } else {
          console.log(`✅ Instance sous-section migrée: ${sousSectionInstance.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration instance sous-section ${sousSectionInstance.id}:`, err);
      }
    }
    
    // Migration des instances d'items
    console.log("📦 Migration des instances d'items...");
    const itemInstancesResult = await pool.request().query("SELECT * FROM item_instance");
    for (const itemInstance of itemInstancesResult.recordset) {
      try {
        const { error } = await supabase
          .from('item_instance')
          .upsert({
            id: itemInstance.id,
            soussection_instance_id: itemInstance.soussection_instance_id,
            item_type_id: itemInstance.item_type_id,
            ordre: itemInstance.ordre,
            quantite: itemInstance.quantite
          });
        
        if (error) {
          console.error(`❌ Erreur migration instance item ${itemInstance.id}:`, error);
        } else {
          console.log(`✅ Instance item migrée: ${itemInstance.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration instance item ${itemInstance.id}:`, err);
      }
    }
    
    // Migration des sous-types d'items
    console.log("📦 Migration des sous-types d'items...");
    const sousItemTypesResult = await pool.request().query("SELECT * FROM sous_item_type");
    for (const sousItemType of sousItemTypesResult.recordset) {
      try {
        const { error } = await supabase
          .from('sous_item_type')
          .upsert({
            id: sousItemType.id,
            item_type_id: sousItemType.item_type_id,
            description: sousItemType.description,
            unite: sousItemType.unite
          });
        
        if (error) {
          console.error(`❌ Erreur migration sous-type item ${sousItemType.id}:`, error);
        } else {
          console.log(`✅ Sous-type item migré: ${sousItemType.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration sous-type item ${sousItemType.id}:`, err);
      }
    }
    
    // Migration des instances de sous-items
    console.log("📦 Migration des instances de sous-items...");
    const sousItemInstancesResult = await pool.request().query("SELECT * FROM sous_item_instance");
    for (const sousItemInstance of sousItemInstancesResult.recordset) {
      try {
        const { error } = await supabase
          .from('sous_item_instance')
          .upsert({
            id: sousItemInstance.id,
            item_instance_id: sousItemInstance.item_instance_id,
            sousitem_type_id: sousItemInstance.sousitem_type_id,
            ordre: sousItemInstance.ordre,
            unite: sousItemInstance.unite,
            quantite: sousItemInstance.quantite,
            prix_unitaire: sousItemInstance.prix_unitaire
          });
        
        if (error) {
          console.error(`❌ Erreur migration instance sous-item ${sousItemInstance.id}:`, error);
        } else {
          console.log(`✅ Instance sous-item migrée: ${sousItemInstance.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration instance sous-item ${sousItemInstance.id}:`, err);
      }
    }
    
    // Migration des remarques
    console.log("📦 Migration des remarques...");
    const remarquesResult = await pool.request().query("SELECT * FROM remarque");
    for (const remarque of remarquesResult.recordset) {
      try {
        const { error } = await supabase
          .from('remarque')
          .upsert({
            id: remarque.id,
            devis_id: remarque.devis_id,
            element_type: remarque.element_type,
            element_id: remarque.element_id,
            contenu: remarque.contenu,
            date_creation: remarque.date_creation,
            date_modification: remarque.date_modification,
            user_id: remarque.user_id
          });
        
        if (error) {
          console.error(`❌ Erreur migration remarque ${remarque.id}:`, error);
        } else {
          console.log(`✅ Remarque migrée: ${remarque.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration remarque ${remarque.id}:`, err);
      }
    }
    
    // Migration des codes de réinitialisation
    console.log("📦 Migration des codes de réinitialisation...");
    const resetCodesResult = await pool.request().query("SELECT * FROM password_reset_codes");
    for (const resetCode of resetCodesResult.recordset) {
      try {
        const { error } = await supabase
          .from('password_reset_codes')
          .upsert({
            id: resetCode.id,
            email: resetCode.email,
            code: resetCode.code,
            created_at: resetCode.created_at,
            expires_at: resetCode.expires_at
          });
        
        if (error) {
          console.error(`❌ Erreur migration code reset ${resetCode.id}:`, error);
        } else {
          console.log(`✅ Code reset migré: ${resetCode.id}`);
        }
      } catch (err) {
        console.error(`❌ Erreur migration code reset ${resetCode.id}:`, err);
      }
    }
    
    await pool.close();
    console.log("🎉 Migration terminée avec succès!");
    
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData }; 