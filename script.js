"use strict";
// **Canvas-Element initialisieren**
// Das `canvas`-Element ist eine Zeichenfläche, auf der das Feuerwerk dargestellt wird.
const canvas = document.getElementById("fireworkCanvas");
const ctx = canvas.getContext("2d"); // Zeichenkontext für 2D-Zeichnungen
// Setzt die Größe des Canvas auf die gesamte Bildschirmbreite und -höhe
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// **HTML-Steuerelemente abrufen**
// Diese Elemente ermöglichen die Konfiguration der Raketen
const colorPicker = document.getElementById("color"); // Farbwahl-Input
const sizeSlider = document.getElementById("size"); // Schieberegler für die Größe
const particlesSlider = document.getElementById("particles"); // Anzahl der Partikel
const saveButton = document.getElementById("saveRocket"); // Button zum Speichern
const loadButton = document.getElementById("loadRockets"); // Button zum Laden
// **Server-URL für die Datenbank**
const SERVER_URL = "https://7c8644f9-f81d-49cd-980b-1883574694b6.fr.bw-cloud-instance.org/ibe46450/mingidb.php";
// **Liste der aktiven Explosionen**
let explosions = []; // Array speichert aktive Explosionen
// **Liste der gespeicherten Raketen**
let savedRockets = []; // Hier werden gespeicherte Raketen abgelegt
// **Partikel-Klasse**
// Jedes Partikel ist eine kleine "Explosion" in der Feuerwerksanimation
class Particle {
    x; // X-Koordinate des Partikels
    y; // Y-Koordinate des Partikels
    size; // Größe des Partikels
    color; // Farbe des Partikels
    speedX; // Geschwindigkeit in X-Richtung
    speedY; // Geschwindigkeit in Y-Richtung
    lifetime; // Wie lange das Partikel sichtbar bleibt
    constructor(x, y, color, size) {
        this.x = x; // Anfangsposition
        this.y = y;
        this.size = size; // Anfangsgröße
        this.color = color; // Farbe
        // Geschwindigkeit zufällig verteilen (-4 bis +4 Pixel pro Frame)
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        // Partikel verschwindet nach 100 Frames
        this.lifetime = 100;
    }
    // **Bewegung und Lebensdauer aktualisieren**
    update() {
        this.x += this.speedX; // Bewegung in X-Richtung
        this.y += this.speedY; // Bewegung in Y-Richtung
        this.size *= 0.98; // Partikel wird kleiner
        this.lifetime -= 1; // Countdown für das Partikel
    }
    // **Partikel auf dem Canvas zeichnen**
    draw() {
        ctx.globalAlpha = this.lifetime / 100; // Transparenz nimmt mit der Lebensdauer ab
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Kreis zeichnen
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
// **Explosion erstellen**
function createExplosion(x, y, rocket) {
    let particles = [];
    // Erstelle Partikel basierend auf der Anzahl, die die Rakete vorgibt
    for (let i = 0; i < rocket.particles; i++) {
        particles.push(new Particle(x, y, rocket.color, rocket.size / 5));
    }
    explosions.push(particles); // Explosion zur Liste hinzufügen
}
// **Rakete auf dem Server speichern**
async function saveRocketToServer(rocket) {
    try {
        let query = new URLSearchParams();
        query.set("command", "insert"); // Speichern-Befehl
        query.set("collection", "rockets"); // Speichert die Rakete in der Datenbank-Kollektion "rockets"
        query.set("data", JSON.stringify(rocket)); // Raketen-Daten in JSON umwandeln
        const response = await fetch(SERVER_URL + "?" + query.toString());
        const responseText = await response.text();
        if (response.ok) {
            alert("✅ Rakete erfolgreich auf dem Server gespeichert!");
        }
        else {
            alert("⚠️ Fehler beim Speichern der Rakete: " + responseText);
        }
    }
    catch (error) {
        console.error("❌ Serverfehler:", error);
        alert("❌ Konnte keine Verbindung zum Server herstellen.");
    }
}
// **Raketen vom Server abrufen**
async function loadRocketsFromServer() {
    try {
        let query = new URLSearchParams();
        query.set("command", "find"); // Abruf-Befehl
        query.set("collection", "rockets"); // Datenbank-Kollektion "rockets"
        query.set("data", "{}"); // Holt alle Raketen
        const response = await fetch(SERVER_URL + "?" + query.toString());
        const responseText = await response.text();
        if (response.ok) {
            savedRockets = JSON.parse(responseText); // Konvertiert die Antwort zu JSON
            alert(`📂 Geladene Raketen: ${savedRockets.length}`);
        }
        else {
            alert("⚠️ Fehler beim Abrufen der Raketen: " + responseText);
        }
    }
    catch (error) {
        console.error("❌ Serverfehler:", error);
        alert("❌ Konnte keine Verbindung zum Server herstellen.");
    }
}
// **Event: Klick auf den Canvas -> Feuerwerk auslösen**
canvas.addEventListener("click", (event) => {
    const rocket = {
        color: colorPicker.value, // Farbe aus der UI
        size: Number(sizeSlider.value), // Größe aus der UI
        particles: Number(particlesSlider.value), // Anzahl der Partikel aus der UI
    };
    createExplosion(event.clientX, event.clientY, rocket);
});
// **Speichern-Button-Event**
saveButton.addEventListener("click", () => {
    const rocket = {
        color: colorPicker.value,
        size: Number(sizeSlider.value),
        particles: Number(particlesSlider.value),
    };
    saveRocketToServer(rocket);
});
// **Laden-Button-Event**
loadButton.addEventListener("click", () => {
    loadRocketsFromServer();
});
// **Animations-Loop für das Feuerwerk**
function animate() {
    // Leichte Abdunklung für Nachzieheffekt
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    explosions.forEach((particles, explosionIndex) => {
        particles.forEach((particle, particleIndex) => {
            particle.update(); // Position aktualisieren
            particle.draw(); // Partikel zeichnen
            if (particle.lifetime <= 0) {
                particles.splice(particleIndex, 1); // Lösche Partikel nach Ablauf der Lebenszeit
            }
        });
        if (particles.length === 0) {
            explosions.splice(explosionIndex, 1); // Lösche Explosionen, wenn keine Partikel mehr vorhanden sind
        }
    });
    requestAnimationFrame(animate); // Nächster Frame wird gerendert
}
// **Animation starten**
animate();
//# sourceMappingURL=script.js.map