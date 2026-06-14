const STORAGE_KEYS = {
  ACCESS_TOKEN: 'oa_access_token',
  TOKEN_EXPIRY: 'oa_token_expiry',
  USER_INFO: 'oa_user_info',
};

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.appdata',
].join(' ');

function getClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google.accounts.oauth2);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve(window.google.accounts.oauth2);
      } else {
        reject(new Error('GIS library loaded but oauth2 not found'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load GIS library'));
    document.head.appendChild(script);
  });
}

async function fetchUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  const data = await res.json();
  return {
    sub: data.sub,
    name: data.name,
    givenName: data.given_name,
    familyName: data.family_name,
    picture: data.picture,
    email: data.email,
    emailVerified: data.email_verified,
  };
}

export async function signIn() {
  const clientId = getClientId();
  if (!clientId) throw new Error('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.');

  const oauth2 = await loadGIS();

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error) {
          if (response.error === 'access_denied') {
            reject(new Error('ACCESS_DENIED'));
          } else {
            reject(new Error(response.error_description || response.error));
          }
          return;
        }
        try {
          const userInfo = await fetchUserInfo(response.access_token);
          const expiry = Date.now() + response.expires_in * 1000;
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
          localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiry));
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
          resolve({ accessToken: response.access_token, tokenExpiry: expiry, user: userInfo });
        } catch (err) {
          reject(err);
        }
      },
      error_callback: (err) => {
        if (err.type === 'popup_closed') {
          reject(new Error('ACCESS_DENIED'));
        } else {
          reject(new Error(err.type || 'Authorization failed'));
        }
      },
    });
    client.requestAccessToken();
  });
}

export async function signOut() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  clearStorage();
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
}

export function getStoredSession() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);

  if (!accessToken || !tokenExpiry || !userInfo) return null;

  const expiry = Number(tokenExpiry);
  if (Number.isNaN(expiry) || Date.now() >= expiry) {
    clearStorage();
    return null;
  }

  return {
    accessToken,
    tokenExpiry: expiry,
    user: JSON.parse(userInfo),
  };
}

export function isTokenExpired() {
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;
  return Date.now() >= Number(expiry) - 300000;
}

export async function verifySession() {
  const session = getStoredSession();
  if (!session) throw new Error('No session');
  if (isTokenExpired()) {
    await refreshToken();
  }
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export async function refreshToken() {
  const clientId = getClientId();
  if (!clientId) throw new Error('Google Client ID not configured');

  const oauth2 = await loadGIS();

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      prompt: '',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || 'Token refresh failed'));
          return;
        }
        const expiry = Date.now() + response.expires_in * 1000;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiry));
        resolve({ accessToken: response.access_token, tokenExpiry: expiry });
      },
      error_callback: (err) => reject(new Error(err.type || 'Token refresh failed')),
    });
    client.requestAccessToken({ prompt: '' });
  });
}
