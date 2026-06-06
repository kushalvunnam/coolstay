const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const getSSLOptions = async () => {
  const certsDir = path.join(__dirname, '..', 'certs');
  const keyPath = path.join(certsDir, 'key.pem');
  const certPath = path.join(certsDir, 'cert.pem');

  // Create certs directory if missing
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Generate self-signed cert if missing
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('[SSL] Generating self-signed SSL certificates for HTTPS...');
    const attrs = [{ name: 'commonName', value: '127.0.0.1' }];
    // selfsigned.generate() returns a Promise in this version
    const pems = await selfsigned.generate(attrs, { days: 365 });
    
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
    console.log('[SSL] SSL certificates generated successfully at server/certs/');
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
};

module.exports = getSSLOptions;
