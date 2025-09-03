-- Script complet pour créer le schéma de base de données pour la gestion des devis

-- Table User (déjà existante, à modifier si nécessaire)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='User' AND xtype='U')
CREATE TABLE [User] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nom NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) DEFAULT 'user'
);

-- Table Client (déjà existante, à modifier si nécessaire)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Client' AND xtype='U')
CREATE TABLE Client (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nom_entreprise NVARCHAR(100) NOT NULL,
    contact NVARCHAR(100),
    adresse NVARCHAR(200),
    code_postal NVARCHAR(10),
    ville NVARCHAR(100),
    telephone NVARCHAR(20),
    email NVARCHAR(100),
    reference_client NVARCHAR(50)
);

-- Table Devis (modifiée selon le schéma)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Devis' AND xtype='U')
CREATE TABLE Devis (
    id INT IDENTITY(1,1) PRIMARY KEY,
    reference NVARCHAR(50) NOT NULL,
    date_creation DATETIME DEFAULT GETDATE(),
    date_valide DATE,
    objet NVARCHAR(500),
    condition_paiement NVARCHAR(200),
    date_modification DATETIME,
    total_ht DECIMAL(10,2) DEFAULT 0,
    client_id INT,
    user_id INT,
    FOREIGN KEY (client_id) REFERENCES Client(id),
    FOREIGN KEY (user_id) REFERENCES [User](id)
);

-- Table SectionType (templates de sections)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SectionType' AND xtype='U')
CREATE TABLE SectionType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    description NVARCHAR(200),
    category NVARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES [User](id)
);

-- Table SousSectionType (templates de sous-sections)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SousSectionType' AND xtype='U')
CREATE TABLE SousSectionType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    section_type_id INT,
    [order] INT,
    title NVARCHAR(200),
    FOREIGN KEY (section_type_id) REFERENCES SectionType(id)
);

-- Table SectionInstance (sections réelles dans un devis)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SectionInstance' AND xtype='U')
CREATE TABLE SectionInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    devis_id INT,
    section_type_id INT,
    [order] INT,
    FOREIGN KEY (devis_id) REFERENCES Devis(id),
    FOREIGN KEY (section_type_id) REFERENCES SectionType(id)
);

-- Table SousSectionInstance (sous-sections réelles dans un devis)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SousSectionInstance' AND xtype='U')
CREATE TABLE SousSectionInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    section_instance_id INT,
    sous_section_type_id INT,
    [order] INT,
    FOREIGN KEY (section_instance_id) REFERENCES SectionInstance(id),
    FOREIGN KEY (sous_section_type_id) REFERENCES SousSectionType(id)
);

-- Table ItemType (templates d'items)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ItemType' AND xtype='U')
CREATE TABLE ItemType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sous_section_type_id INT,
    [order] INT,
    size NVARCHAR(50),
    description NVARCHAR(500),
    unite NVARCHAR(20),
    FOREIGN KEY (sous_section_type_id) REFERENCES SousSectionType(id)
);

-- Table ItemInstance (items réels dans un devis)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ItemInstance' AND xtype='U')
CREATE TABLE ItemInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sous_item_instance_id INT,
    item_type_id INT,
    [order] INT,
    size NVARCHAR(50),
    description NVARCHAR(500),
    unite NVARCHAR(20),
    quantite DECIMAL(10,2),
    FOREIGN KEY (sous_item_instance_id) REFERENCES SousItemInstance(id),
    FOREIGN KEY (item_type_id) REFERENCES ItemType(id)
);

-- Table SousItemType (templates de sous-items)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SousItemType' AND xtype='U')
CREATE TABLE SousItemType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    item_type_id INT,
    [order] INT,
    size NVARCHAR(50),
    description NVARCHAR(500),
    unite NVARCHAR(20),
    quantite DECIMAL(10,2),
    FOREIGN KEY (item_type_id) REFERENCES ItemType(id)
);

-- Table SousItemInstance (sous-items réels dans un devis)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SousItemInstance' AND xtype='U')
CREATE TABLE SousItemInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    item_instance_id INT,
    sous_item_type_id INT,
    [order] INT,
    size NVARCHAR(50),
    description NVARCHAR(500),
    unite NVARCHAR(20),
    FOREIGN KEY (item_instance_id) REFERENCES ItemInstance(id),
    FOREIGN KEY (sous_item_type_id) REFERENCES SousItemType(id)
);

-- Table ValeurType (templates de valeurs)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ValeurType' AND xtype='U')
CREATE TABLE ValeurType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(50),
    label NVARCHAR(200)
);

-- Table ValeurInstance (valeurs réelles)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ValeurInstance' AND xtype='U')
CREATE TABLE ValeurInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(50),
    element_id INT,
    label NVARCHAR(200)
);

-- Table RemarqueType (templates de remarques)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RemarqueType' AND xtype='U')
CREATE TABLE RemarqueType (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(50),
    label NVARCHAR(200),
    is_long_text BIT DEFAULT 0
);

-- Table RemarqueInstance (remarques réelles)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RemarqueInstance' AND xtype='U')
CREATE TABLE RemarqueInstance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    element_type NVARCHAR(50),
    element_id INT,
    content NVARCHAR(MAX)
);

-- Index pour améliorer les performances
CREATE INDEX IX_Devis_Reference ON Devis(reference);
CREATE INDEX IX_Devis_ClientId ON Devis(client_id);
CREATE INDEX IX_Devis_UserId ON Devis(user_id);
CREATE INDEX IX_Devis_DateCreation ON Devis(date_creation);
CREATE INDEX IX_SectionInstance_DevisId ON SectionInstance(devis_id);
CREATE INDEX IX_SousSectionInstance_SectionId ON SousSectionInstance(section_instance_id);
CREATE INDEX IX_ItemInstance_SousItemId ON ItemInstance(sous_item_instance_id);
CREATE INDEX IX_SousItemInstance_ItemId ON SousItemInstance(item_instance_id);

-- Insertion de données de test pour les types de sections
INSERT INTO SectionType (user_id, description, category) VALUES 
(1, 'Etendue des travaux', 'Travaux'),
(1, 'Contrôle Qualité - HSE', 'Qualité'),
(1, 'Bordereau de prix', 'Prix'),
(1, 'Délai de réalisation', 'Planning'),
(1, 'Conditions de paiement', 'Paiement'),
(1, 'Validité de l''offre', 'Validité');

-- Insertion de données de test pour les sous-sections
INSERT INTO SousSectionType (section_type_id, [order], title) VALUES 
(1, 1, 'Surface intérieure des ballons : Système CS7'),
(1, 2, 'Surface extérieure des ballons : Système CS7'),
(2, 1, 'Qualité'),
(2, 2, 'HSE'),
(3, 1, 'Prix des prestations');

-- Insertion de données de test pour les items
INSERT INTO ItemType (sous_section_type_id, [order], size, description, unite) VALUES 
(1, 1, 'normal', 'Sablage SA2,5 suivant les normes suédoises;', ''),
(1, 2, 'normal', 'Dépoussiérage et nettoyage;', ''),
(1, 3, 'normal', 'Fourniture et application de la peinture :', ''),
(1, 4, 'indent', '- Couches de peinture époxy TANKGUARD 412', ''),
(3, 1, 'normal', 'Contrôle comparatif de sablage avec cliché de la norme SIS55900;', ''),
(3, 2, 'normal', 'Contrôle de l''épaisseur du film de peinture suivant la norme NFT30-124;', ''),
(3, 3, 'normal', 'Contrôle de l''adhérence suivant méthode ASTM - X CUT Type A;', ''),
(3, 4, 'normal', 'Détermination du point de rosée (thermomètre - hygromètre);', ''),
(4, 1, 'normal', 'Protection individuelle et collective;', ''),
(4, 2, 'normal', 'Suivi et mise en œuvre de la politique sécurité du site;', ''),
(5, 1, 'table', 'Surface intérieure des ballons', 'M²'),
(5, 2, 'table', 'Surface extérieure des ballons', 'M²'); 