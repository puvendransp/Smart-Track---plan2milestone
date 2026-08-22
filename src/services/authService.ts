/**
 * Authentication & OAuth service for Google Drive & Calendar API access
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID) {
  console.error('VITE_GOOGLE_CLIENT_ID is missing. Please set your OAuth Client ID in .env');
}

const TOKEN_KEY = 'google_access_token';
const EXPIRY_KEY = 'google_token_expiry';

export const getStoredAccessToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);

  if (token && expiry) {
    if (Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
  }
  return token;
};

export const setStoredAccessToken = (token: string, expiresInSeconds: number = 3600): void => {
  localStorage.setItem(TOKEN_KEY, token);
  const expiryTime = Date.now() + (expiresInSeconds - 60) * 1000; // 1-minute margin safety buffer
  localStorage.setItem(EXPIRY_KEY, expiryTime.toString());
};

export const clearStoredAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
};

export interface AuthResult {
  accessToken: string;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
}

/**
 * Fetches user profile (email, name, picture) using the access token
 */
export const fetchUserProfile = async (token: string): Promise<{ email?: string; name?: string; picture?: string }> => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        email: data.email,
        name: data.name,
        picture: data.picture,
      };
    }
  } catch (err) {
    console.warn('Could not fetch Google user profile:', err);
  }
  return {};
};

/**
 * Prompts user for Google OAuth consent and returns access_token
 */
export const googleSignIn = (): Promise<AuthResult | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const initClient = (gis: any) => {
      const client = gis.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response && response.access_token) {
            const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
            setStoredAccessToken(response.access_token, expiresIn);

            const profile = await fetchUserProfile(response.access_token);

            resolve({
              accessToken: response.access_token,
              userEmail: profile.email,
              userName: profile.name,
              userPicture: profile.picture,
            });
          } else {
            console.error('OAuth sign-in failed or cancelled:', response);
            resolve(null);
          }
        },
        error_callback: (err: any) => {
          if (err?.type === 'popup_closed' || (typeof err === 'string' && err.includes('closed'))) {
            console.warn('OAuth authentication cancelled: Popup window was closed by the user.');
          } else {
            console.error('OAuth token client error:', err);
          }
          resolve(null);
        },
      });

      // Prompt omitted to avoid repeated consent screens on subsequent logins
      client.requestAccessToken();
    };

    const g = (window as any).google;

    if (g?.accounts?.oauth2) {
      initClient(g);
    } else {
      // Dynamic loading fallback
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        const gis = (window as any).google;
        if (gis?.accounts?.oauth2) {
          initClient(gis);
        } else {
          alert('Google Identity Services script failed to initialize.');
          resolve(null);
        }
      };
      script.onerror = () => {
        alert('Failed to load Google Identity script. Please check your network connection.');
        resolve(null);
      };
      document.body.appendChild(script);
    }
  });
};