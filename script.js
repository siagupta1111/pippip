// Create the map centered on Noida
const map = L.map('map').setView([28.5672, 77.3178], 13);

// OpenStreetMap tiles (free)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Placeholder – later we’ll add line‑drawing logic

// Helper – format today's date
function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

// When the user clicks “Download PDF”
document.getElementById('downloadBtn').addEventListener('click', async () => {
  // Ask for the applicant’s name (simple prompt)
  const applicant = prompt("Enter your name (for the ordinance):", "Your Name");
  if (!applicant) return; // abort if they cancel

  // Fill the hidden template
  document.getElementById('applicantName').textContent = applicant;
  document.getElementById('todayDate').textContent = formatDate(new Date());

  // Put the line’s coordinates into the box
  const coordsBox = document.getElementById('coordsBox');
  if (window.corridorGeoJSON) {
    const coords = window.corridorGeoJSON.geometry.coordinates[0]; // array of [lng, lat]
    const pretty = coords.map(c => `Lng: ${c[0].toFixed(6)}  Lat: ${c[1].toFixed(6)}`).join("\n");
    coordsBox.textContent = pretty;

    // Calculate length of the corridor (in km)
    const R = 6371e3; // metres
    let length = 0;
    for (let i = 1; i < coords.length; i++) {
      const [lon1, lat1] = coords[i - 1];
      const [lon2, lat2] = coords[i];
      const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      length += R * c;
    }
    document.getElementById('lengthBox').textContent = `${(length/1000).toFixed(2)} km`;
  } else {
    coordsBox.textContent = "No corridor drawn yet.";
    document.getElementById('lengthBox').textContent = "0 km";
  }

  // Render the hidden div to a canvas, create PDF
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(document.getElementById('pdfTemplate'), {
    scale: 2, // higher resolution
    useCORS: true
  });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save('ordinance.pdf'); // name of downloaded file

  alert('PDF ordinance created! Check your downloads.');
});
