/**
 * Authentication & OAuth service for Google Drive API access
 */

const rawClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_ID = (rawClientId && rawClientId !== 'YOUR_PLAN2MILESTONE_CLIENT_ID') 
  ? rawClientId 
  : '809054363294-dev.apps.googleusercontent.com';
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
  const expiryTime = Date.now() + (expiresInSeconds - 60) * 1000; // 1 min margin
  localStorage.setItem(EXPIRY_KEY, expiryTime.toString());
};

export const clearStoredAccessToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
};

export interface AuthResult {
  accessToken: string;
  userEmail?: string;
}

/**
 * Prompts user for Google OAuth consent and returns access_token
 */
export const googleSignIn = (): Promise<AuthResult | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const g = (window as any).google;
    
    if (g && g.accounts && g.accounts.oauth2) {
      const client = g.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response && response.access_token) {
            const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
            setStoredAccessToken(response.access_token, expiresIn);
            resolve({
              accessToken: response.access_token,
              userEmail: 'Puvendran@gmail.com', // user account context
            });
          } else {
            console.error('OAuth sign in failed or cancelled', response);
            resolve(null);
          }
        },
        error_callback: (err: any) => {
          console.error('OAuth token client error:', err);
          resolve(null);
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } else {
      // Fallback if script is loading: load dynamic GIS script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        const gis = (window as any).google;
        if (gis && gis.accounts && gis.accounts.oauth2) {
          const client = gis.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events',
            callback: (response: any) => {
              if (response && response.access_token) {
                setStoredAccessToken(response.access_token, 3600);
                resolve({ accessToken: response.access_token });
              } else {
                resolve(null);
              }
            }
          });
          client.requestAccessToken({ prompt: 'consent' });
        } else {
          alert('Google Identity Services script failed to initialize.');
          resolve(null);
        }
      };
      script.onerror = () => {
        alert('Failed to load Google Identity script. Please check connection.');
        resolve(null);
      };
      document.body.appendChild(script);
    }
  });
};
