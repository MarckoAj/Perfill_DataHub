const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /\/\*\s*={50,}\s*MODAL PONTO\/CLIENTE\s*={50,}\s*\*\/[\s\S]*?(?=<\/style>)/i;

if (regex.test(html)) {
  html = html.replace(regex, '');
  if (!html.includes('point-modal.css')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="point-modal.css">\n</head>');
  }
  fs.writeFileSync('index.html', html);
  console.log('index.html updated successfully.');
} else {
  console.log('Regex did not match the inline styles for point-modal.');
}
