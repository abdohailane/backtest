-- =============================================
-- Script de mise à jour de la base de données
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
-- Mise à jour de la table Devis
-- =============================================

-- Ajouter les colonnes manquantes à la table Devis
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Devis') AND name = 'date_validite')
BEGIN
    ALTER TABLE Devis ADD date_validite DATE;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Devis') AND name = 'conditions_paiement')
BEGIN
    ALTER TABLE Devis ADD conditions_paiement NVARCHAR(300);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Devis') AND name = 'delai_realisation')
BEGIN
    ALTER TABLE Devis ADD delai_realisation NVARCHAR(200);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Devis') AND name = 'tva')
BEGIN
    ALTER TABLE Devis ADD tva DECIMAL(5,2) DEFAULT 20.00;
END

-- Renommer les colonnes si nécessaire
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Devis') AND name = 'condition_paiement')
BEGIN
    EXEC sp_rename 'Devis.condition_paiement', 'conditions_paiement', 'COLUMN';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Devis') AND name = 'date_creation')
BEGIN
    EXEC sp_rename 'Devis.date_creation', 'date_creation_old', 'COLUMN';
    ALTER TABLE Devis ADD date_creation DATE DEFAULT GETDATE();
    UPDATE Devis SET date_creation = CAST(date_creation_old AS DATE);
    ALTER TABLE Devis DROP COLUMN date_creation_old;
END

-- =============================================
-- Création des nouvelles tables SectionType
-- =============================================

CREATE TABLE SectionType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titre NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    categorie NVARCHAR(50),
    created_by INT,
    date_creation DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (created_by) REFERENCES [User](id) ON DELETE SET NULL
);
GO

-- =============================================
-- Création de la table SousSectionType
-- =============================================

CREATE TABLE SousSectionType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    section_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    titre NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    FOREIGN KEY (section_type_id) REFERENCES SectionType(id) ON DELETE CASCADE
);
GO

-- =============================================
-- Création de la table ItemType
-- =============================================

CREATE TABLE ItemType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    soussection_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    titre NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    unite NVARCHAR(20),
    prix_unitaire DECIMAL(10,2) DEFAULT 0.00,
    type_valeur NVARCHAR(20),
    FOREIGN KEY (soussection_type_id) REFERENCES SousSectionType(id) ON DELETE CASCADE
);
GO

-- =============================================
-- Création de la table SousItemType
-- =============================================

CREATE TABLE SousItemType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    item_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    description NVARCHAR(500),
    unite NVARCHAR(20),
    quantite DECIMAL(10,2) DEFAULT 1.00,
    prix_unitaire DECIMAL(10,2) DEFAULT 0.00,
    total AS (quantite * prix_unitaire),
    FOREIGN KEY (item_type_id) REFERENCES ItemType(id) ON DELETE CASCADE
);
GO

-- =============================================
-- Création de la table ValeurType
-- =============================================

CREATE TABLE ValeurType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(20) NOT NULL CHECK (element_type IN ('itemtype', 'sousitemtype')),
    element_id INT NOT NULL,
    label NVARCHAR(100) NOT NULL,
    valeur NVARCHAR(100) NOT NULL,
    est_selectionne BIT NOT NULL DEFAULT 0
);
GO

-- =============================================
-- Création de la table RemarqueType
-- =============================================

CREATE TABLE RemarqueType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(20) NOT NULL CHECK (element_type IN ('sectiontype', 'soussectiontype', 'itemtype', 'sousitemtype')),
    element_id INT NOT NULL,
    contenu NVARCHAR(MAX) NOT NULL,
    date_ajout DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- =============================================
-- Création des tables d'instances
-- =============================================

CREATE TABLE SectionInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    devis_id INT NOT NULL,
    section_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    titre NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    FOREIGN KEY (devis_id) REFERENCES Devis(id) ON DELETE CASCADE,
    FOREIGN KEY (section_type_id) REFERENCES SectionType(id)
);
GO

CREATE TABLE SousSectionInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    section_instance_id INT NOT NULL,
    soussection_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    titre NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    FOREIGN KEY (section_instance_id) REFERENCES SectionInstance(id) ON DELETE CASCADE,
    FOREIGN KEY (soussection_type_id) REFERENCES SousSectionType(id)
);
GO

CREATE TABLE ItemInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    soussection_instance_id INT NOT NULL,
    item_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    titre NVARCHAR(200) NOT NULL,
    description NVARCHAR(500),
    unite NVARCHAR(20),
    quantite DECIMAL(10,2) DEFAULT 1.00,
    prix_unitaire DECIMAL(10,2) DEFAULT 0.00,
    total AS (quantite * prix_unitaire),
    type_valeur NVARCHAR(20),
    FOREIGN KEY (soussection_instance_id) REFERENCES SousSectionInstance(id) ON DELETE CASCADE,
    FOREIGN KEY (item_type_id) REFERENCES ItemType(id)
);
GO

CREATE TABLE SousItemInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    item_instance_id INT NOT NULL,
    sousitem_type_id INT NOT NULL,
    ordre INT NOT NULL DEFAULT 0,
    description NVARCHAR(500),
    unite NVARCHAR(20),
    quantite DECIMAL(10,2) DEFAULT 1.00,
    prix_unitaire DECIMAL(10,2) DEFAULT 0.00,
    total AS (quantite * prix_unitaire),
    FOREIGN KEY (item_instance_id) REFERENCES ItemInstance(id) ON DELETE CASCADE,
    FOREIGN KEY (sousitem_type_id) REFERENCES SousItemType(id)
);
GO

CREATE TABLE ValeurInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(20) NOT NULL CHECK (element_type IN ('iteminstance', 'sousiteminstance')),
    element_id INT NOT NULL,
    label NVARCHAR(100) NOT NULL,
    valeur NVARCHAR(100) NOT NULL,
    est_selectionne BIT NOT NULL DEFAULT 0
);
GO

CREATE TABLE RemarqueInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(20) NOT NULL CHECK (element_type IN ('sectioninstance', 'soussectioninstance', 'iteminstance', 'sousiteminstance')),
    element_id INT NOT NULL,
    contenu NVARCHAR(MAX) NOT NULL,
    date_ajout DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- =============================================
-- Création des index pour les performances
-- =============================================

-- Index pour les types
CREATE INDEX IX_SectionType_categorie ON SectionType(categorie);
CREATE INDEX IX_ValeurType_element ON ValeurType(element_type, element_id);
CREATE INDEX IX_RemarkType_element ON RemarqueType(element_type, element_id);

-- Index pour les instances
CREATE INDEX IX_SectionInstance_devis ON SectionInstance(devis_id);
CREATE INDEX IX_SousSectionInstance_section ON SousSectionInstance(section_instance_id);
CREATE INDEX IX_ItemInstance_soussection ON ItemInstance(soussection_instance_id);
CREATE INDEX IX_SousItemInstance_item ON SousItemInstance(item_instance_id);

-- Index pour les valeurs et remarques instances
CREATE INDEX IX_ValeurInstance_element ON ValeurInstance(element_type, element_id);
CREATE INDEX IX_RemarkInstance_element ON RemarqueInstance(element_type, element_id);
GO

-- =============================================
-- Insertion de données de test
-- =============================================

-- Insérer des types de sections de test
INSERT INTO SectionType (titre, description, categorie) VALUES 
('Etendue des travaux', 'Description détaillée des travaux à réaliser', 'Travaux'),
('Contrôle Qualité - HSE', 'Contrôles qualité et sécurité', 'Qualité'),
('Bordereau de prix', 'Détail des prix et tarifs', 'Prix'),
('Délai de réalisation', 'Planning et délais de livraison', 'Planning'),
('Conditions de paiement', 'Modalités de paiement', 'Paiement'),
('Validité de l''offre', 'Durée de validité de l''offre', 'Validité');

-- Insérer des sous-sections de test
INSERT INTO SousSectionType (section_type_id, ordre, titre, description) VALUES 
(1, 1, 'Surface intérieure des ballons : Système CS7', 'Traitement des surfaces intérieures'),
(1, 2, 'Surface extérieure des ballons : Système CS7', 'Traitement des surfaces extérieures'),
(2, 1, 'Qualité', 'Contrôles qualité'),
(2, 2, 'HSE', 'Hygiène, Sécurité, Environnement'),
(3, 1, 'Prix des prestations', 'Détail des prix');

-- Insérer des items de test
INSERT INTO ItemType (soussection_type_id, ordre, titre, description, unite) VALUES 
(1, 1, 'Sablage SA2,5', 'Sablage SA2,5 suivant les normes suédoises', 'm²'),
(1, 2, 'Dépoussiérage et nettoyage', 'Dépoussiérage et nettoyage des surfaces', 'm²'),
(1, 3, 'Application peinture', 'Fourniture et application de la peinture', 'm²'),
(1, 4, 'Couches de peinture époxy', 'Couches de peinture époxy TANKGUARD 412', 'm²'),
(3, 1, 'Contrôle comparatif', 'Contrôle comparatif de sablage avec cliché de la norme SIS55900', 'unité'),
(3, 2, 'Contrôle épaisseur', 'Contrôle de l''épaisseur du film de peinture suivant la norme NFT30-124', 'unité');

PRINT 'Mise à jour de la base de données terminée avec succès!';
GO 