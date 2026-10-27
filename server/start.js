
import dns from 'node:dns';

// Use Google DNS and Cloudflare DNS
// for MongoDB Atlas SRV record resolution.
dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

// Start the backend after DNS configuration.
await import('./src/index.js');
