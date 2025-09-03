-- =============================================
-- Script de mise à jour finale de la base de données
-- Structure simplifiée selon l'image fournie
-- =============================================

USE gestion_devis;
GO

-- =============================================
-- Suppression des anciennes tables si elles existent
-- =============================================

-- Supprimer les tables dans l'ordre inverse des dépendances
IF OBJECT_ID('RemarqueInstance', 'U') IS NOT NULL DROP TABLE RemarqueInstance;
IF OBJECT_ID('ValeurInstance', 'U') IS NOT NULL DROP TABLE ValeurInstance;
IF OBJECT_ID('SousItemInstance', 'U') IS NOT NULL DROP TABLE SousItemInstance;
IF OBJECT_ID('ItemInstance', 'U') IS NOT NULL DROP TABLE ItemInstance;
IF OBJECT_ID('SousSectionInstance', 'U') IS NOT NULL DROP TABLE SousSectionInstance;
IF OBJECT_ID('SectionInstance', 'U') IS NOT NULL DROP TABLE SectionInstance;

IF OBJECT_ID('RemarqueType', 'U') IS NOT NULL DROP TABLE RemarqueType;
IF OBJECT_ID('ValeurType', 'U') IS NOT NULL DROP TABLE ValeurType;
IF OBJECT_ID('SousItemType', 'U') IS NOT NULL DROP TABLE SousItemType;
IF OBJECT_ID('ItemType', 'U') IS NOT NULL DROP TABLE ItemType;
IF OBJECT_ID('SousSectionType', 'U') IS NOT NULL DROP TABLE SousSectionType;
IF OBJECT_ID('SectionType', 'U') IS NOT NULL DROP TABLE SectionType;

-- =============================================
-- Création des nouvelles tables simplifiées
-- =============================================

-- SectionType (description)
CREATE TABLE SectionType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    description NVARCHAR(500) NOT NULL
);
GO

-- SousSectionType (section_type_id, description)
CREATE TABLE SousSectionType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    section_type_id INT NOT NULL,
    description NVARCHAR(500) NOT NULL,
    FOREIGN KEY (section_type_id) REFERENCES SectionType(id) ON DELETE CASCADE
);
GO

-- ItemType (soussection_type_id, description)
CREATE TABLE ItemType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    soussection_type_id INT NOT NULL,
    description NVARCHAR(500) NOT NULL,
    FOREIGN KEY (soussection_type_id) REFERENCES SousSectionType(id) ON DELETE CASCADE
);
GO

-- SousItemType (item_type_id, description, unite)
CREATE TABLE SousItemType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    item_type_id INT NOT NULL,
    description NVARCHAR(500) NOT NULL,
    unite NVARCHAR(50),
    FOREIGN KEY (item_type_id) REFERENCES ItemType(id) ON DELETE CASCADE
);
GO

-- =============================================
-- Création des tables d'instances
-- =============================================

-- SectionInstance
CREATE TABLE SectionInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    devis_id INT NOT NULL,
    section_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    FOREIGN KEY (devis_id) REFERENCES Devis(id) ON DELETE CASCADE,
    FOREIGN KEY (section_type_id) REFERENCES SectionType(id)
);
GO

-- SousSectionInstance
CREATE TABLE SousSectionInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    section_instance_id INT NOT NULL,
    soussection_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    FOREIGN KEY (section_instance_id) REFERENCES SectionInstance(id) ON DELETE CASCADE,
    FOREIGN KEY (soussection_type_id) REFERENCES SousSectionType(id)
);
GO

-- ItemInstance
CREATE TABLE ItemInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    soussection_instance_id INT NOT NULL,
    item_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    quantite DECIMAL(10,2) DEFAULT 1.00,
    FOREIGN KEY (soussection_instance_id) REFERENCES SousSectionInstance(id) ON DELETE CASCADE,
    FOREIGN KEY (item_type_id) REFERENCES ItemType(id)
);
GO

-- SousItemInstance
CREATE TABLE SousItemInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    item_instance_id INT NOT NULL,
    sousitem_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    quantite DECIMAL(10,2) DEFAULT 1.00,
    unite NVARCHAR(50),
    FOREIGN KEY (item_instance_id) REFERENCES ItemInstance(id) ON DELETE CASCADE,
    FOREIGN KEY (sousitem_type_id) REFERENCES SousItemType(id)
);
GO

-- =============================================
-- Création des index pour les performances
-- =============================================

CREATE INDEX IX_SectionInstance_devis ON SectionInstance(devis_id);
CREATE INDEX IX_SousSectionInstance_section ON SousSectionInstance(section_instance_id);
CREATE INDEX IX_ItemInstance_soussection ON ItemInstance(soussection_instance_id);
CREATE INDEX IX_SousItemInstance_item ON SousItemInstance(item_instance_id);
GO

-- =============================================
-- Insertion des données selon l'image
-- =============================================

-- 1. SectionType : "Etendue des travaux"
INSERT INTO SectionType (description) VALUES 
('Etendue des travaux');

-- 2. SousSectionType : "Surface intérieure des ballons : Système CS7"
INSERT INTO SousSectionType (section_type_id, description) VALUES 
(1, 'Surface intérieure des ballons : Système CS7'),
(1, 'Surface extérieure des ballons : Système CS2 catégorie C5');

-- 3. ItemType : Sous "Surface intérieure des ballons : Système CS7"
INSERT INTO ItemType (soussection_type_id, description) VALUES 
(1, 'Sablage SA2,5 suivant les normes suédoises'),
(1, 'Dépoussiérage et nettoyage'),
(1, 'Fourniture et application de la peinture');

-- 4. SousItemType : Sous "Fourniture et application de la peinture"
INSERT INTO SousItemType (item_type_id, description, unite) VALUES 
(3, 'Couches de peinture époxy TANKGUARD 412', '380µm');

-- 5. ItemType : Sous "Surface extérieure des ballons : Système CS2 catégorie C5"
INSERT INTO ItemType (soussection_type_id, description) VALUES 
(2, 'Sablage SA2,5 suivant les normes suédoises'),
(2, 'Dépoussiérage et nettoyage'),
(2, 'Fourniture et application de la peinture');

-- 6. SousItemType : Sous "Fourniture et application de la peinture" (surface extérieure)
INSERT INTO SousItemType (item_type_id, description, unite) VALUES 
(6, 'Couche primaire époxy PENGUARD SPECIAL', '100µm'),
(6, 'Couche intermédiaire époxy PENGUARD EXPRESS MIO', '200µm'),
(6, 'Couche de finition polyuréthane HARDTOP XP', '60µm');

-- Mise à jour de la table Devis pour inclure les champs nécessaires à la génération PDF
-- Ajout des champs pour les remarques, unités, données de prix et valeurs de sous-sections

-- Vérifier si les colonnes existent déjà avant de les ajouter
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'remarques')
BEGIN
    ALTER TABLE Devis ADD remarques NVARCHAR(MAX) NULL;
    PRINT 'Colonne remarques ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne remarques existe déjà';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'unites')
BEGIN
    ALTER TABLE Devis ADD unites NVARCHAR(MAX) NULL;
    PRINT 'Colonne unites ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne unites existe déjà';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'priceData')
BEGIN
    ALTER TABLE Devis ADD priceData NVARCHAR(MAX) NULL;
    PRINT 'Colonne priceData ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne priceData existe déjà';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Devis' AND COLUMN_NAME = 'sousSectionValues')
BEGIN
    ALTER TABLE Devis ADD sousSectionValues NVARCHAR(MAX) NULL;
    PRINT 'Colonne sousSectionValues ajoutée';
END
ELSE
BEGIN
    PRINT 'Colonne sousSectionValues existe déjà';
END

-- Mettre à jour les colonnes existantes avec des valeurs par défaut si nécessaire
UPDATE Devis SET remarques = '{}' WHERE remarques IS NULL;
UPDATE Devis SET unites = '{}' WHERE unites IS NULL;
UPDATE Devis SET priceData = '{}' WHERE priceData IS NULL;
UPDATE Devis SET sousSectionValues = '{}' WHERE sousSectionValues IS NULL;

PRINT 'Mise à jour de la table Devis terminée avec succès !';

PRINT 'Mise à jour de la base de données terminée avec succès!';
PRINT 'Structure créée selon l''image fournie.';
GO 

IF COL_LENGTH('Devis', 'elements') IS NULL
BEGIN
    ALTER TABLE Devis ADD elements NVARCHAR(MAX);
END 