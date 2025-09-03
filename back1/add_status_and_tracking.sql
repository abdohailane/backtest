-- Script pour ajouter les colonnes status et email_tracking à la table Devis
-- Exécuter ce script pour mettre à jour la structure de la base de données

-- Ajouter la colonne status
ALTER TABLE Devis ADD status NVARCHAR(20) DEFAULT 'non envoyé';

-- Ajouter la colonne email_tracking pour stocker l'ID de tracking unique
ALTER TABLE Devis ADD email_tracking NVARCHAR(100);

-- Ajouter la colonne email_sent_at pour stocker la date d'envoi
ALTER TABLE Devis ADD email_sent_at DATETIME;

-- Ajouter la colonne email_opened_at pour stocker la date d'ouverture
ALTER TABLE Devis ADD email_opened_at DATETIME;

-- Mettre à jour les devis existants
UPDATE Devis SET status = 'non envoyé' WHERE status IS NULL;

-- Créer un index sur la colonne status pour améliorer les performances
CREATE INDEX IX_Devis_Status ON Devis(status);

-- Créer un index sur la colonne email_tracking
CREATE INDEX IX_Devis_EmailTracking ON Devis(email_tracking);

-- Créer un index sur la colonne email_sent_at
CREATE INDEX IX_Devis_EmailSentAt ON Devis(email_sent_at); 