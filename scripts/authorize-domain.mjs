import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

const projectId = 'diu-ai';
const domain = process.argv[2] || 'asrahi-7.github.io';
const keyFile = fileURLToPath(new URL('../serviceAccountKey.json', import.meta.url));

const auth = new GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const client = await auth.getClient();
const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

const current = await client.request({
  url,
  method: 'GET',
  validateStatus: () => true,
});

if (current.status < 200 || current.status >= 300) {
  throw new Error(`Could not read Auth config: ${current.status} ${JSON.stringify(current.data)}`);
}

const domains = new Set(current.data.authorizedDomains || []);
domains.add(domain);

const updated = await client.request({
  url: `${url}?updateMask=authorizedDomains`,
  method: 'PATCH',
  data: { authorizedDomains: [...domains] },
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
});

if (updated.status < 200 || updated.status >= 300) {
  throw new Error(`Could not update Auth config: ${updated.status} ${JSON.stringify(updated.data)}`);
}

console.log(`Authorized Firebase Auth domain: ${domain}`);
