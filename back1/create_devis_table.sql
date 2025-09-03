-- Script pour créer la table Devis
CREATE TABLE Devis (
    id INT IDENTITY(1,1) PRIMARY KEY,
    reference NVARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    destinataire NVARCHAR(100),
    societe NVARCHAR(100),
    telephone NVARCHAR(20),
    vRef NVARCHAR(50),
    objet NVARCHAR(500),
    nombrePages INT DEFAULT 1,
    client_id INT,
    user_id INT,
    date_creation DATETIME DEFAULT GETDATE(),
    date_modification DATETIME,
    elements NVARCHAR(MAX), -- Ajouté pour stocker la structure JSON du devis
    FOREIGN KEY (client_id) REFERENCES Client(id),
    FOREIGN KEY (user_id) REFERENCES [User](id)
);

-- Index pour améliorer les performances
CREATE INDEX IX_Devis_Reference ON Devis(reference);
CREATE INDEX IX_Devis_ClientId ON Devis(client_id);
CREATE INDEX IX_Devis_UserId ON Devis(user_id);
CREATE INDEX IX_Devis_DateCreation ON Devis(date_creation); 