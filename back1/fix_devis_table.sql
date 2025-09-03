-- Script pour corriger la table Devis et ajouter les colonnes manquantes
-- Ce script vérifie et ajoute les colonnes nécessaires

USE gestion_devis;
GO

-- Vérifier et ajouter la colonne 'status' si elle n'existe pas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'status')
BEGIN
    ALTER TABLE Devis ADD status NVARCHAR(50) DEFAULT 'non envoyé';
    PRINT 'Colonne status ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne status existe déjà';
END

-- Vérifier et ajouter la colonne 'remarques' si elle n'existe pas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'remarques')
BEGIN
    ALTER TABLE Devis ADD remarques NVARCHAR(MAX) NULL;
    PRINT 'Colonne remarques ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne remarques existe déjà';
END

-- Vérifier et ajouter la colonne 'unites' si elle n'existe pas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'unites')
BEGIN
    ALTER TABLE Devis ADD unites NVARCHAR(MAX) NULL;
    PRINT 'Colonne unites ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne unites existe déjà';
END

-- Vérifier et ajouter la colonne 'priceData' si elle n'existe pas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'priceData')
BEGIN
    ALTER TABLE Devis ADD priceData NVARCHAR(MAX) NULL;
    PRINT 'Colonne priceData ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne priceData existe déjà';
END

-- Vérifier et ajouter la colonne 'sousSectionValues' si elle n'existe pas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'sousSectionValues')
BEGIN
    ALTER TABLE Devis ADD sousSectionValues NVARCHAR(MAX) NULL;
    PRINT 'Colonne sousSectionValues ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne sousSectionValues existe déjà';
END

-- Vérifier et ajouter la colonne 'email_sent_at' si elle n'existe pas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'email_sent_at')
BEGIN
    ALTER TABLE Devis ADD email_sent_at DATETIME NULL;
    PRINT 'Colonne email_sent_at ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne email_sent_at existe déjà';
END

-- Mettre à jour les colonnes existantes avec des valeurs par défaut si nécessaire
UPDATE Devis SET status = 'non envoyé' WHERE status IS NULL;
UPDATE Devis SET remarques = '{}' WHERE remarques IS NULL;
UPDATE Devis SET unites = '{}' WHERE unites IS NULL;
UPDATE Devis SET priceData = '{}' WHERE priceData IS NULL;
UPDATE Devis SET sousSectionValues = '{}' WHERE sousSectionValues IS NULL;

PRINT 'Mise à jour de la table Devis terminée avec succès !';
PRINT 'Toutes les colonnes nécessaires sont maintenant présentes.';
GO