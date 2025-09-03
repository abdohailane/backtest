// backend/db.js
const sql = require("mssql");
require("dotenv").config();

const config = {
  user: "devis", // ton nom d'utilisateur SQL Server
  password: "abdoabdo", // ton mot de passe SQL Server
  server: "STG-SB3", // nom de la machine/serveur
  database: "gestion_devis", // nom de la base de données
  options: {
    encrypt: true,
    trustServerCertificate: true,
    trustedConnection: true,
    enableArithAbort: true,
    instanceName: "SQLEXPRESS" // instance SQL Server
  },
  port:1433
};

module.exports = { sql, config };
