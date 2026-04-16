// ---------- MAP INITIALISATION ----------
const map = L.map('map').setView([28.5672, 77.3178], 13); // Noida centre

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ---------- DRAWING TOOL ----------
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    rectangle: false,
    circle: false,
    marker: false,
    circlemarker: false,
    polyline: {
      shapeOptions: {
        color: '#6FAF5F',
        weight: 5
      },
      metric: true,
      repeatMode: false
    }
  },
  edit: {
    featureGroup: drawnItems,
    edit: false,
    remove: false
  }
});
map.addControl(drawControl);

// Store the most recent corridor in a global variable
map.on(L.Draw.Event.CREATED, function (e) {
  const layer = e.layer;
  drawnItems.clearLayers();      // keep only the newest line
  drawnItems.addLayer(layer);
  window.corridorGeoJSON = layer.toGeoJSON(); // used later for PDF
});

// ---------- HELPERS ----------
function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

// ---------- PDF GENERATION ----------
document.getElementById('downloadBtn').addEventListener('click', async () => {
  // 1️⃣ Ask for applicant name (simple prompt)
  const applicant = prompt('Enter your name (for the ordinance):', 'Your Name');
  if (!applicant) return; // user cancelled

  // 2️⃣ Fill the hidden template
  document.getElementById('applicantName').textContent = applicant;
  document.getElementById('todayDate').textContent = formatDate(new Date());

  // 3️⃣ Coordinates & length
  const coordsBox = document.getElementById('coordsBox');
  const lengthBox = document.getElementById('lengthBox');

  if (window.corridorGeoJSON) {
    const coords = window.corridorGeoJSON.geometry.coordinates[0]; // array of [lng, lat]

    // Pretty‑print coordinates
    const pretty = coords.map(c => `Lng: ${c[0].toFixed(6)}  Lat: ${c[1].toFixed(6)}`).join('\n');
    coordsBox.textContent = pretty;

    // Approximate length using the haversine formula
    const R = 6371e3; // metres
    let length = 0;
    for (let i = 1; i < coords.length; i++) {
      const [lon1, lat1] = coords[i - 1];
      const [lon2, lat2] = coords[i];
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) ** 2 +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      length += R * c;
    }
    lengthBox.textContent = `${(length / 1000).toFixed(2)} km`;
  } else {
    coordsBox.textContent = 'No corridor drawn yet.';
    lengthBox.textContent = '0 km';
  }

  // 4️⃣ Render hidden template to canvas, then to PDF
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(document.getElementById('pdfTemplate'), {
    scale: 2,
    useCORS: true
  });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save('PipPip_Ordinance.pdf');

  alert('PDF generated – check your downloads folder.');
});
