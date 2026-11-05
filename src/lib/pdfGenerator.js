export async function generateBrochurePDF() {
  const html = `<!doctype html><html><head><title>ISATS Brochure</title><style>body{font-family:Arial,sans-serif;padding:40px;line-height:1.6}h1{color:#0878d1}</style></head><body><h1>ISATS</h1><h2>Institute of Skill-based Aesthetic & Trichology Sciences</h2><p>Courses in Trichology, Aesthetics and Clinical Aesthetics.</p><p>For the complete brochure, please contact ISATS.</p></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ISATS-Brochure.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
