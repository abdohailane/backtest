-- Script pour nettoyer les colonnes de tracking inutiles
-- Exécuter ce script pour simplifier la base de données

-- Supprimer les colonnes de tracking qui ne sont plus utilisées
ALTER TABLE Devis DROP COLUMN email_tracking;
ALTER TABLE Devis DROP COLUMN email_opened_at;

-- Garder seulement les colonnes nécessaires :
-- - status (non envoyé / envoyé)
-- - email_sent_at (date d'envoi)

-- Vérifier la structure finale
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Devis' 
    AND COLUMN_NAME IN ('status', 'email_sent_at', 'email_tracking', 'email_opened_at')
ORDER BY ORDINAL_POSITION;