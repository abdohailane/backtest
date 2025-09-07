const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/user"));
app.use("/api/clients", require("./routes/client"));
app.use("/api/devis", require("./routes/devis-neon"));
app.use("/api/sections", require("./routes/sections-neon"));

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Backend démarré sur le port " + process.env.PORT);
});
