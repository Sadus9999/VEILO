export default async function handler(req, res) {
  try {
    const url = 'https://drive.usercontent.google.com/download?id=1o4T3_VxeAe77I_uxY06uk8byRm1ukaYw&export=download&confirm=t';
    const response = await fetch(url, { redirect: 'follow' });

    if (!response.ok) {
      res.status(response.status).json({ error: 'Could not fetch test PDF' });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load test PDF' });
  }
}
