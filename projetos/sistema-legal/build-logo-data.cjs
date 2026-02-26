const fs = require('fs');
const path = require('path');
const assetsDir = path.join(__dirname, '..', '..', 'assets');
const logoPath = fs.existsSync(path.join(assetsDir, 'ana.png'))
  ? path.join(assetsDir, 'ana.png')
  : path.join(assetsDir, 'logo-solicitadora.png');
const outPath = path.join(__dirname, 'logo-data.js');
const b64 = fs.readFileSync(logoPath).toString('base64');
fs.writeFileSync(outPath, 'window.LOGO_DATA_URI="data:image/png;base64,' + b64 + '";\n');
console.log('logo-data.js gerado com sucesso.');
