/**
 * Google Drive REST API v3 service for file & folder management
 */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3/files';

class DriveService {
  private token: string | null = null;

  public setToken(token: string | null): void {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public hasToken(): boolean {
    return !!this.token;
  }

  private async fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('Google Drive access token missing. Please connect your Google account.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetches folder metadata including name and parents
   */
  public async getFolderMetadata(folderId: string): Promise<DriveFileItem> {
    if (folderId === 'root') {
      return { id: 'root', name: 'My Drive', mimeType: 'application/vnd.google-apps.folder' };
    }
    const url = `${DRIVE_API_BASE}/${folderId}?fields=id,name,mimeType,parents`;
    return this.fetchApi<DriveFileItem>(url);
  }

  /**
   * Lists subfolders inside a specific parent folder
   */
  public async listFolders(parentFolderId: string = 'root'): Promise<DriveFileItem[]> {
    const q = encodeURIComponent(
      `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const url = `${DRIVE_API_BASE}?q=${q}&fields=files(id,name,mimeType,parents,modifiedTime)&orderBy=name`;
    const res = await this.fetchApi<{ files: DriveFileItem[] }>(url);
    return res.files || [];
  }

  /**
   * Searches anywhere in Drive for parent folder (.AppData.SmartTrack or AppData.SmartTrack) without creating
   */
  public async findParentFolder(folderName: string = '.AppData.SmartTrack'): Promise<DriveFileItem | null> {
    const q = encodeURIComponent(
      `(name = '${folderName}' or name = 'AppData.SmartTrack') and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchUrl = `${DRIVE_API_BASE}?q=${q}&fields=files(id,name,mimeType,parents)`;
    const searchRes = await this.fetchApi<{ files: DriveFileItem[] }>(searchUrl);

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0];
    }
    return null;
  }

  /**
   * Searches for a subfolder inside parent folder without creating
   */
  public async findFolder(folderName: string, parentFolderId: string = 'root'): Promise<DriveFileItem | null> {
    const q = encodeURIComponent(
      `name = '${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchUrl = `${DRIVE_API_BASE}?q=${q}&fields=files(id,name,mimeType,parents)`;
    const searchRes = await this.fetchApi<{ files: DriveFileItem[] }>(searchUrl);

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0];
    }
    return null;
  }

  /**
   * Searches anywhere in Drive for parent folder (.AppData.SmartTrack or AppData.SmartTrack)
   */
  public async findOrCreateParentFolder(folderName: string = '.AppData.SmartTrack'): Promise<DriveFileItem> {
    const q = encodeURIComponent(
      `(name = '${folderName}' or name = 'AppData.SmartTrack') and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchUrl = `${DRIVE_API_BASE}?q=${q}&fields=files(id,name,mimeType,parents)`;
    const searchRes = await this.fetchApi<{ files: DriveFileItem[] }>(searchUrl);

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0];
    }

    // Create .AppData.SmartTrack if not found anywhere
    const createRes = await this.fetchApi<DriveFileItem>(DRIVE_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    return createRes;
  }

  /**
   * Searches for a subfolder by name or creates it inside parent folder
   */
  public async findOrCreateFolder(folderName: string, parentFolderId: string = 'root'): Promise<DriveFileItem> {
    const q = encodeURIComponent(
      `name = '${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchUrl = `${DRIVE_API_BASE}?q=${q}&fields=files(id,name,mimeType,parents)`;
    const searchRes = await this.fetchApi<{ files: DriveFileItem[] }>(searchUrl);

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0];
    }

    // Create new folder
    const body: Record<string, any> = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId && parentFolderId !== 'root') {
      body.parents = [parentFolderId];
    }

    const createRes = await this.fetchApi<DriveFileItem>(DRIVE_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return createRes;
  }

  /**
   * Searches for a file by name inside a parent folder
   */
  public async findFile(fileName: string, parentFolderId: string = 'root'): Promise<DriveFileItem | null> {
    const q = encodeURIComponent(
      `name = '${fileName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed = false`
    );
    const url = `${DRIVE_API_BASE}?q=${q}&fields=files(id,name,mimeType,modifiedTime)`;
    const res = await this.fetchApi<{ files: DriveFileItem[] }>(url);
    if (res.files && res.files.length > 0) {
      return res.files[0];
    }
    return null;
  }

  /**
   * Saves or updates a JSON file content in Drive
   */
  public async saveFile(
    fileName: string,
    content: any,
    parentFolderId: string = 'root',
    existingFileId?: string
  ): Promise<{ fileId: string; modifiedTime: string }> {
    let targetFileId = existingFileId;

    if (!targetFileId) {
      const existing = await this.findFile(fileName, parentFolderId);
      if (existing) {
        targetFileId = existing.id;
      }
    }

    const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const nowIso = new Date().toISOString();

    if (targetFileId) {
      // Update existing file content
      const updateUrl = `${UPLOAD_API_BASE}/${targetFileId}?uploadType=media`;
      const res = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: contentString,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to update Drive file: ${errText}`);
      }

      return { fileId: targetFileId, modifiedTime: nowIso };
    } else {
      // Create new file with metadata
      const boundary = 'smarttrack_bnd_' + Date.now();
      const metadata: Record<string, any> = {
        name: fileName,
        mimeType: 'application/json',
      };
      if (parentFolderId && parentFolderId !== 'root') {
        metadata.parents = [parentFolderId];
      }

      const multipartBody =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${contentString}\r\n` +
        `--${boundary}--`;

      const response = await fetch(`${UPLOAD_API_BASE}?uploadType=multipart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create file in Drive: ${errText}`);
      }

      const created = await response.json();
      return { fileId: created.id, modifiedTime: nowIso };
    }
  }

  /**
   * Reads JSON content of a file from Drive
   */
  public async readFile<T = any>(fileId: string): Promise<T> {
    const downloadUrl = `${DRIVE_API_BASE}/${fileId}?alt=media`;
    if (!this.token) {
      throw new Error('Access token required to read file');
    }

    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to read file from Drive (${response.status}): ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Helper to load Google GAPI & Picker library dynamically
   */
  private async loadPickerLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      const w = window as any;
      if (w.gapi && w.google?.picker) {
        resolve();
        return;
      }

      let script = document.getElementById('google-api-script') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'google-api-script';
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        document.body.appendChild(script);
      }

      const checkAndLoad = () => {
        if (w.gapi) {
          w.gapi.load('picker', {
            callback: () => {
              if (w.google?.picker) {
                resolve();
              } else {
                reject(new Error("Failed to initialize Google Picker sub-library"));
              }
            },
            onerror: () => reject(new Error("Gapi load 'picker' failed")),
          });
        } else {
          setTimeout(checkAndLoad, 100);
        }
      };

      script.onload = checkAndLoad;
      script.onerror = () => reject(new Error("Failed to load Google API script tag"));
    });
  }

  /**
   * Displays Google Drive Folder Picker UI
   */
/**
   * Displays Google Drive Folder Picker UI
   */
  public async showFolderPicker(
    accessToken: string,
    onFolderSelect: (id: string, name: string) => void
  ): Promise<void> {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';

    if (!apiKey) {
      console.warn(
        'VITE_GOOGLE_API_KEY is not defined in environment variables. Google Picker requires a Developer API Key.'
      );
    }

    await this.loadPickerLibrary();
    const w = window as any;
    const google = w.google;

    if (!google?.picker) {
      throw new Error('Google Picker library not loaded.');
    }

    const docsView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
      .setMimeTypes('application/vnd.google-apps.folder')
      .setSelectFolderEnabled(true);

    const builder = new google.picker.PickerBuilder()
      .addView(docsView)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setAppId('614372660797')
      .setCallback((data: any) => {
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
          const doc = data[google.picker.Response.DOCUMENTS][0];
          const id = doc[google.picker.Document.ID];
          const name = doc[google.picker.Document.NAME];
          onFolderSelect(id, name);
        }
      });

    const picker = builder.build();
    picker.setVisible(true);
  }
}

export const driveService = new DriveService();
