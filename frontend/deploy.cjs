const https = require('https');
const { execSync } = require('child_process');

const token = 'nfp_vDUUdS4P7YjVDF8PnRXYHuVkvUYZKPXqa88a';

const data = JSON.stringify({
  name: 'shiftsync-prod-webapp'
});

const req = https.request('https://api.netlify.com/api/v1/sites', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const site = JSON.parse(body);
    console.log('Created site:', site.id);
    
    // Now trigger deployment!
    try {
      console.log('Deploying to Netlify...');
      const out = execSync(`npx netlify-cli deploy --prod --dir=dist --site=${site.id} --auth=${token}`, { stdio: 'inherit' });
      console.log('Deployment successful!');
      console.log('Live URL:', site.ssl_url || site.url);
    } catch (e) {
      console.error('Deployment failed:', e);
    }
  });
});

req.on('error', console.error);
req.write(data);
req.end();
