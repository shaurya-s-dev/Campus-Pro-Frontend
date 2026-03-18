const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://campus-pro-backend-qoa8.onrender.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const response = await fetch(`${BACKEND}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Backend unreachable: ' + e.message });
  }
}
