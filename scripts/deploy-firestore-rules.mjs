import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

const projectId = 'diu-ai';
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const keyFile = fileURLToPath(new URL('../serviceAccountKey.json', import.meta.url));

const auth = new GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const client = await auth.getClient();

async function request(url, options = {}) {
  const res = await client.request({
    url,
    method: options.method || 'GET',
    data: options.body,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`${options.method || 'GET'} ${url} failed with ${res.status}: ${JSON.stringify(res.data)}`);
  }

  return res.data;
}

const ruleset = await request(
  `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
  {
    method: 'POST',
    body: {
      source: {
        files: [{
          name: 'firestore.rules',
          fingerprint: '',
          content: rules,
        }],
      },
    },
  },
);

const releaseName = `projects/${projectId}/releases/cloud.firestore`;

try {
  await request(
    `https://firebaserules.googleapis.com/v1/${releaseName}`,
    {
      method: 'PATCH',
      body: {
        release: {
          name: releaseName,
          rulesetName: ruleset.name,
        },
        updateMask: 'rulesetName',
      },
    },
  );
} catch (error) {
  if (!String(error.message).includes('404')) throw error;
  await request(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
    {
      method: 'POST',
      body: {
        release: {
          name: releaseName,
          rulesetName: ruleset.name,
        },
      },
    },
  );
}

console.log(`Firestore rules deployed: ${ruleset.name}`);
