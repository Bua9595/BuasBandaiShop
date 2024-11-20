const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(express.json());

// Bestand abrufen
app.get("/bestand", (req, res) => {
    const bestand = JSON.parse(fs.readFileSync("bestand.json", "utf8"));
    res.json(bestand);
});

// Karte verkaufen
app.post("/verkauf", (req, res) => {
    const { id } = req.body;
    const bestand = JSON.parse(fs.readFileSync("bestand.json", "utf8"));

    if (bestand[id] && bestand[id].quantity > 0) {
        bestand[id].quantity--;
        fs.writeFileSync("bestand.json", JSON.stringify(bestand, null, 2));
        res.json({ success: true, newQuantity: bestand[id].quantity });
    } else {
        res.status(400).json({ success: false, message: "Nicht verfügbar" });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
