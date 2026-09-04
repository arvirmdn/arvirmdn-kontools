const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Log current directory untuk debugging
console.log('Server starting...');
console.log('Current directory:', __dirname);
console.log('Files in directory:', fs.readdirSync(__dirname));

// Serve static files dari folder yang sama dengan server.js
app.use(express.static(__dirname));

// Fallback ke index.html untuk SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found. Pastikan semua file (index.html, style.css, script.js) ikut di-deploy.');
  }
});

app.listen(PORT, () => {
  console.log(`arvirmdn kontools v0.1 running on port ${PORT}`);
});
