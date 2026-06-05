import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_PROJECT_ID = 'pt-kuda-jaya-abadi';
const DEFAULT_DATABASE_ID = '(default)';

const args = parseArgs(process.argv.slice(2));

if (!args.serviceAccount) {
  console.error([
    'Usage:',
    '  node scripts/exportFirestore.mjs --serviceAccount ./path/service-account.json --out docs/firestore-export.json --sanitize',
    '',
    'Options:',
    '  --projectId <id>        Firebase/GCP project ID. Defaults to service account project_id or pt-kuda-jaya-abadi.',
    '  --databaseId <id>       Firestore database ID. Default: (default)',
    '  --out <file>            Output JSON path. Default: docs/firestore-export.json',
    '  --sanitize              Redact common personal/sensitive fields for sharing.',
    '  --collections a,b,c     Optional root collection allow-list.',
  ].join('\n'));
  process.exit(1);
}

const serviceAccount = JSON.parse(await fs.readFile(args.serviceAccount, 'utf8'));
const projectId = args.projectId || serviceAccount.project_id || DEFAULT_PROJECT_ID;
const databaseId = args.databaseId || DEFAULT_DATABASE_ID;
const outFile = args.out || 'docs/firestore-export.json';
const rootCollections = args.collections
  ? args.collections.split(',').map((item) => item.trim()).filter(Boolean)
  : null;

const token = await getAccessToken(serviceAccount);
const exportData = {
  exportedAt: new Date().toISOString(),
  projectId,
  databaseId,
  source: 'Cloud Firestore',
  collections: {},
};

const collectionIds = rootCollections || await listCollectionIds({
  token,
  projectId,
  databaseId,
  documentPath: '',
});

for (const collectionId of collectionIds) {
  exportData.collections[collectionId] = await exportCollection({
    token,
    projectId,
    databaseId,
    collectionPath: collectionId,
  });
}

const finalData = args.sanitize ? sanitize(exportData) : exportData;
await fs.mkdir(path.dirname(outFile), { recursive: true });
await fs.writeFile(outFile, JSON.stringify(finalData, null, 2));

console.log(`Exported ${collectionIds.length} root collection(s) to ${outFile}`);

function parseArgs(rawArgs) {
  const parsed = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = rawArgs[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claimSet))}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(serviceAccount.private_key, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

async function listCollectionIds({ token, projectId, databaseId, documentPath }) {
  const parent = documentPath
    ? `projects/${projectId}/databases/${databaseId}/documents/${documentPath}`
    : `projects/${projectId}/databases/${databaseId}/documents`;
  const url = `https://firestore.googleapis.com/v1/${parent}:listCollectionIds`;
  const ids = [];
  let pageToken;

  do {
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ pageSize: 300, pageToken }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list collections at "${documentPath || '/'}": ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    ids.push(...(data.collectionIds || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return ids.sort();
}

async function exportCollection({ token, projectId, databaseId, collectionPath }) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionPath}`;
  const result = {};
  let pageToken;

  do {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set('pageSize', '300');
    if (pageToken) requestUrl.searchParams.set('pageToken', pageToken);

    const response = await fetch(requestUrl, { headers: authHeaders(token) });
    if (!response.ok) {
      throw new Error(`Failed to export collection "${collectionPath}": ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    for (const doc of data.documents || []) {
      const id = doc.name.split('/').pop();
      const documentPath = doc.name.split('/documents/')[1];
      const subcollectionIds = await listCollectionIds({
        token,
        projectId,
        databaseId,
        documentPath,
      });

      result[id] = {
        id,
        path: documentPath,
        createTime: doc.createTime,
        updateTime: doc.updateTime,
        fields: decodeFields(doc.fields || {}),
      };

      if (subcollectionIds.length > 0) {
        result[id].subcollections = {};
        for (const subcollectionId of subcollectionIds) {
          result[id].subcollections[subcollectionId] = await exportCollection({
            token,
            projectId,
            databaseId,
            collectionPath: `${documentPath}/${subcollectionId}`,
          });
        }
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return result;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function decodeFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]),
  );
}

function decodeValue(value) {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('stringValue' in value) return value.stringValue;
  if ('bytesValue' in value) return value.bytesValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return value;
}

function sanitize(value, key = '') {
  const sensitiveKey = /password|email|phone|address|url|publicId|chassisNumber|engineNumber|plateNumber|policeNo|ownerName|customerName|fullName|name|username/i;
  const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const phone = /^(\+?62|0)?[0-9\s-]{8,}$/;

  if (Array.isArray(value)) return value.map((item) => sanitize(item, key));

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, sanitize(childValue, childKey)]),
    );
  }

  if (typeof value === 'string') {
    if (sensitiveKey.test(key) && value !== '') return `[REDACTED_${key}]`;
    if (/^https?:\/\//i.test(value)) return '[REDACTED_URL]';
    if (email.test(value)) return '[REDACTED_EMAIL]';
    if (phone.test(value)) return '[REDACTED_PHONE]';
  }

  return value;
}
