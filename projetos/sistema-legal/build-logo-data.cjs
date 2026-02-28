const fs = require('fs');
const path = require('path');
const assetsDir = path.join(__dirname, '..', '..', 'assets');

// Preferir SVG (vetorial = melhor qualidade); depois PNG/JPG da Ana Paula Medina
const candidates = [
  path.join(assetsDir, 'ana.svg'),
  path.join(assetsDir, 'logo-solicitadora.svg'),
  path.join(assetsDir, 'ana.png'),
  path.join(assetsDir, 'logo-solicitadora.png'),
  path.join(assetsDir, 'ana.jpg')
];
let logoPath = null;
let mime = 'image/png';
for (const p of candidates) {
  if (fs.existsSync(p)) {
    logoPath = p;
    const ext = p.toLowerCase();
    if (ext.endsWith('.svg')) mime = 'image/svg+xml';
    else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) mime = 'image/jpeg';
    else mime = 'image/png';
    break;
  }
}

if (!logoPath) {
  console.error('Nenhuma logo encontrada em assets/ (ana.svg, logo-solicitadora.svg, ana.png, logo-solicitadora.png).');
  process.exit(1);
}

const outPath = path.join(__dirname, 'logo-data.js');
const b64 = fs.readFileSync(logoPath).toString('base64');
const dataUri = `data:${mime};base64,${b64}`;
fs.writeFileSync(outPath, 'window.LOGO_DATA_URI="' + dataUri.replace(/"/g, '\\"') + '";\n');
console.log('logo-data.js gerado com sucesso (' + (mime === 'image/svg+xml' ? 'SVG' : mime === 'image/jpeg' ? 'JPG' : 'PNG') + ').');
