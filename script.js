"use strict";
// **Canvas-Element initialisieren**
// Das `canvas`-Element ist eine HTML-Zeichenfläche, auf der das Feuerwerk gezeichnet wird.
// Es wird über die ID "fireworkCanvas" aus dem HTML-Dokument referenziert.
const canvas = document.getElementById("fireworkCanvas");
// Der Zeichenkontext `ctx` ist eine API für das Zeichnen von 2D-Grafiken.
// Mit `ctx` erstellen wir Formen, Farben und Animationen.
const ctx = canvas.getContext("2d");
// Die Größe des Canvas wird auf die Fenstergröße angepasst,
// damit das Feuerwerk den gesamten Bildschirm einnimmt.
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// **HTML-Steuerelemente abrufen**
// Diese Steuerelemente ermöglichen den Nutzer:innen, die Eigenschaften der Rakete (Farbe, Größe, Partikelanzahl) anzupassen.
const colorPicker = document.getElementById("color"); // Farbwahl-Input
const sizeSlider = document.getElementById("size"); // Schieberegler für die Größe
const particlesSlider = document.getElementById("particles"); // Schieberegler für die Anzahl der Partikel
const saveButton = document.getElementById("saveRocket"); // Button zum Speichern der Rakete
const loadButton = document.getElementById("loadRockets"); // Button zum Laden gespeicherter Raketen
// **Server-URL**
// Der Server wird verwendet, um Raketen zu speichern und abzurufen. 
// Hier wird die URL deines MongoDB-Servers festgelegt.
const SERVER_URL = "https://7c8644f9-f81d-49cd-980b-1883574694b6.fr.bw-cloud-instance.org/ibe46450";
// **Liste der aktiven Explosionen**
// Diese Liste speichert alle Explosionen, die auf dem Bildschirm dargestellt werden.
// Jede Explosion ist eine Liste von Partikeln.
let explosions = [];
// **Liste der gespeicherten Raketen**
// Diese Liste speichert die Raketen, die Nutzer:innen erstellt und gespeichert haben.
// Sie kann später auf dem Server gespeichert oder von dort abgerufen werden.
let savedRockets = [];
// **Partikel-Klasse**
// Ein Partikel ist ein kleiner Punkt, der Teil einer Explosion ist.
// Die Klasse beschreibt, wie ein Partikel aussieht und sich verhält.
class Particle {
    x; // X-Koordinate des Partikels
    y; // Y-Koordinate des Partikels
    size; // Größe des Partikels (Radius)
    color; // Farbe des Partikels
    speedX; // Horizontale Geschwindigkeit des Partikels
    speedY; // Vertikale Geschwindigkeit des Partikels
    lifetime; // Lebensdauer des Partikels (wie lange es sichtbar ist)
    constructor(x, y, color, size) {
        this.x = x; // Startposition auf der X-Achse
        this.y = y; // Startposition auf der Y-Achse
        this.size = size; // Anfangsgröße des Partikels
        this.color = color; // Farbe des Partikels
        this.speedX = (Math.random() - 0.5) * 8; // Zufällige Geschwindigkeit in X-Richtung
        this.speedY = (Math.random() - 0.5) * 8; // Zufällige Geschwindigkeit in Y-Richtung
        this.lifetime = 100; // Partikel verschwindet nach 100 Frames
    }
    // **Bewegung und Lebenszeit aktualisieren**
    update() {
        this.x += this.speedX; // X-Position basierend auf der Geschwindigkeit anpassen
        this.y += this.speedY; // Y-Position basierend auf der Geschwindigkeit anpassen
        this.size *= 0.98; // Größe des Partikels langsam verringern
        this.lifetime -= 1; // Lebenszeit reduzieren
    }
    // **Partikel zeichnen**
    draw() {
        ctx.globalAlpha = this.lifetime / 100; // Transparenz basierend auf verbleibender Lebenszeit einstellen
        ctx.fillStyle = this.color; // Farbe des Partikels setzen
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Kreis zeichnen
        ctx.fill();
        ctx.globalAlpha = 1; // Transparenz zurücksetzen
    }
}
// **Explosion erstellen**
// Diese Funktion erzeugt eine Explosion an einer bestimmten Position (`x`, `y`) mit den Eigenschaften der Rakete.
function createExplosion(x, y, rocket) {
    let particles = []; // Liste für die Partikel der Explosion
    for (let i = 0; i < rocket.particles; i++) {
        // Jedes Partikel wird mit den Raketenwerten erstellt
        particles.push(new Particle(x, y, rocket.color, rocket.size / 5));
    }
    explosions.push(particles); // Die Explosion wird zur Liste der Explosionen hinzugefügt
}
// **Rakete auf dem Server speichern**
// Diese Funktion sendet die Rakete an den Server, um sie dort zu speichern.
async function saveRocketToServer(rocket) {
    try {
        const response = await fetch(`${SERVER_URL}/rockets`, {
            method: "POST", // HTTP-Methode POST (zum Senden von Daten)
            headers: {
                "Content-Type": "application/json", // Daten werden als JSON gesendet
            },
            body: JSON.stringify(rocket), // Raketenobjekt wird in einen JSON-String umgewandelt
        });
        if (response.ok) {
            alert("Rakete erfolgreich auf dem Server gespeichert!");
        }
        else {
            alert("Fehler beim Speichern der Rakete auf dem Server.");
        }
    }
    catch (error) {
        console.error("Serverfehler:", error);
        alert("Konnte keine Verbindung zum Server herstellen.");
    }
}
// **Raketen vom Server abrufen**
// Diese Funktion lädt alle gespeicherten Raketen vom Server.
async function loadRocketsFromServer() {
    try {
        const response = await fetch(`${SERVER_URL}/rockets`); // GET-Anfrage an den Server
        if (response.ok) {
            const data = await response.json(); // Serverantwort in ein JavaScript-Objekt umwandeln
            savedRockets = data; // Gespeicherte Raketen aktualisieren
            alert(`Geladene Raketen: ${savedRockets.length}`);
        }
        else {
            alert("Fehler beim Abrufen der Raketen vom Server.");
        }
    }
    catch (error) {
        console.error("Serverfehler:", error);
        alert("Konnte keine Verbindung zum Server herstellen.");
    }
}
// **Event: Klick auf den Canvas**
// Diese Funktion wird aufgerufen, wenn Nutzer:innen auf den Canvas klicken.
canvas.addEventListener("click", (event) => {
    const rocket = {
        color: colorPicker.value, // Farbe aus dem Farbwähler
        size: Number(sizeSlider.value), // Größe aus dem Schieberegler
        particles: Number(particlesSlider.value), // Partikelanzahl aus dem Schieberegler
    };
    createExplosion(event.clientX, event.clientY, rocket); // Explosion an der geklickten Stelle erzeugen
});
// **Speichern-Button-Event**
saveButton.addEventListener("click", () => {
    const rocket = {
        color: colorPicker.value,
        size: Number(sizeSlider.value),
        particles: Number(particlesSlider.value),
    };
    saveRocketToServer(rocket); // Rakete auf dem Server speichern
});
// **Laden-Button-Event**
loadButton.addEventListener("click", () => {
    loadRocketsFromServer(); // Raketen vom Server laden
});
// **Animations-Loop**
// Diese Funktion wird kontinuierlich aufgerufen, um Explosionen zu aktualisieren und zu zeichnen.
function animate() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // Hintergrund halbtransparent übermalen
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Explosionen durchlaufen und aktualisieren
    explosions.forEach((particles, explosionIndex) => {
        particles.forEach((particle, particleIndex) => {
            particle.update(); // Partikelposition und Lebenszeit aktualisieren
            particle.draw(); // Partikel zeichnen
            // Entferne Partikel, wenn ihre Lebenszeit abgelaufen ist
            if (particle.lifetime <= 0) {
                particles.splice(particleIndex, 1);
            }
        });
        // Entferne Explosionen, wenn alle Partikel verschwunden sind
        if (particles.length === 0) {
            explosions.splice(explosionIndex, 1);
        }
    });
    requestAnimationFrame(animate); // Nächsten Frame anfordern
}
// **Animation starten**
// Die Animations-Loop-Funktion wird gestartet, um kontinuierlich Explosionen darzustellen.
animate();
//# sourceMappingURL=script.js.map