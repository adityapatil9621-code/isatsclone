// Sends the admission application (details + PDF documents) to a Google Apps Script
// web app owned by isats.sales1@gmail.com. The script emails everything to that
// inbox - no server and no app password required.
// Setup: see google-apps-script/README.md, then put the web app URL in .env:
//   VITE_APPLICATION_API_URL=https://script.google.com/macros/s/XXXX/exec
const API_URL = import.meta.env.VITE_APPLICATION_API_URL;

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read one of the files.'));
    reader.readAsDataURL(file);
  });

export async function submitApplication({ details, documents }) {
  if (!API_URL) {
    throw new Error('Applications are not enabled yet: VITE_APPLICATION_API_URL is not set.');
  }

  const payload = {
    ...details,
    documents: await Promise.all(
      documents.map(async ({ id, label, file }) => ({
        id,
        label,
        name: file.name,
        data: await toBase64(file),
      }))
    ),
  };

  // text/plain avoids a CORS preflight, which Apps Script web apps do not answer
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.ok) {
    throw new Error((result && result.error) || 'Could not send your application. Please try again.');
  }
  return result;
}
