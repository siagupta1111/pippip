// Create the map centered on Noida
const map = L.map('map').setView([28.5672, 77.3178], 13);

// OpenStreetMap tiles (free)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Placeholder – later we’ll add line‑drawing logic
