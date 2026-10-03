const ical = require('node-ical');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ICS_URL = process.env.GCAL_ICS_URL;

if (!ICS_URL) {
  console.error('❌ Falta la variable de entorno GCAL_ICS_URL');
  process.exit(1);
}

function descargar(url, saltos = 0) {
  if (saltos > 5) return Promise.reject(new Error('Demasiadas redirecciones'));
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return descargar(res.headers.location, saltos + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', c => raw += c);
      res.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('⬇️  Descargando ICS...');
    const raw = await descargar(ICS_URL);

    console.log('🔄 Parseando ICS...');
    const data = ical.sync.parseICS(raw);

    const eventos = Object.values(data)
      .filter(e => e.type === 'VEVENT')
      .map(e => {
        const inicio = e.start instanceof Date ? e.start : new Date(e.start);
        const fin = e.end ? (e.end instanceof Date ? e.end : new Date(e.end)) : null;
        return {
          uid: e.uid,
          titulo: e.summary || '(Sin título)',
          inicio: inicio.toISOString(),
          fin: fin ? fin.toISOString() : null,
          todoElDia: e.start?.dateOnly === true,
          lugar: e.location || '',
          descripcion: (e.description || '').trim()
        };
      })
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

    const salida = path.join('data', 'eventos.json');
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync(salida, JSON.stringify(eventos, null, 2), 'utf8');

    console.log(`✅ ${eventos.length} eventos guardados en ${salida}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();