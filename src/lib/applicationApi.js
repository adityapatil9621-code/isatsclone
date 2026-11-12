// Sends the admission application (details + PDF documents) to the ISATS server,
// which emails everything to admin@isatscosmetology.com (see server/apply.js).

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read one of the files.'));
    reader.readAsDataURL(file);
  });

export async function submitApplication({ details, documents }) {
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

  const response = await fetch('/api/apply', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result || !result.ok) {
    throw new Error((result && result.error) || 'Could not send your application. Please try again.');
  }
  return result;
}