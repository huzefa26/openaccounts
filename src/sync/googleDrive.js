import { isTokenExpired, refreshToken, getAccessToken } from './googleAuth';

const FILE_NAME = 'openaccounts.json';
const BOUNDARY = 'oa_drive_boundary';

function buildMultipartBody(metadata, data) {
  const encoder = new TextEncoder();
  const parts = [
    `--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(data)}\r\n`,
    `--${BOUNDARY}--\r\n`,
  ];
  return parts.join('');
}

async function ensureToken() {
  if (isTokenExpired()) {
    await refreshToken();
  }
  return getAccessToken();
}

async function driveFetch(url, options = {}) {
  const token = await ensureToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let message;
    try {
      const json = JSON.parse(body);
      message = json.error?.message || json.error_description || res.statusText;
    } catch {
      message = body || res.statusText;
    }
    throw new Error(`Drive API error (${res.status}): ${message}`);
  }
  return res;
}

export async function findFile(options = {}) {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${FILE_NAME}'`,
    fields: 'files(id,modifiedTime)',
  });
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?${params}`, options);
  const body = await res.json();
  const files = body.files || [];
  return files.length > 0 ? { id: files[0].id, modifiedTime: files[0].modifiedTime } : null;
}

export async function readFile(fileId, options = {}) {
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, options);
  return res.json();
}

export async function createFile(data) {
  const token = await ensureToken();
  const metadata = { name: FILE_NAME, parents: ['appDataFolder'] };
  const multipartBody = buildMultipartBody(metadata, data);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
    },
    body: multipartBody,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive upload error (${res.status}): ${body}`);
  }
  return res.json();
}

export async function updateFile(fileId, data) {
  const token = await ensureToken();
  const metadata = { name: FILE_NAME };
  const multipartBody = buildMultipartBody(metadata, data);

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
    },
    body: multipartBody,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive update error (${res.status}): ${body}`);
  }
  return res.json();
}
