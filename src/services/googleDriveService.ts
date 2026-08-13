import { SmartTrackAppData, SyncStatus } from '../types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export const DRIVE_FOLDER_NAME = '.AppData.SmartTrack';
export const APP_SUBFOLDER_NAME = 'smart-track-plan2milestone';
export const FILE_NAME = 'smart_track_plan2milestone.json';

export class GoogleDriveService {
  /**
   * Helper to execute Drive REST API calls with access token
   */
  private static async fetchDrive(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ) {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Finds or creates folder hierarchy: .AppData.SmartTrack -> Plan2Milestone
   */
  public static async ensureAppFolderStructure(accessToken: string): Promise<{
    rootFolderId: string;
    subfolderId: string;
  }> {
    // 1. Search for root folder ".AppData.SmartTrack"
    const rootQuery = encodeURIComponent(
      `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const rootResult = await this.fetchDrive(
      `${DRIVE_API_URL}?q=${rootQuery}&fields=files(id,name)`,
      accessToken
    );

    let rootFolderId: string;
    if (rootResult.files && rootResult.files.length > 0) {
      rootFolderId = rootResult.files[0].id;
    } else {
      // Create .AppData.SmartTrack folder
      const createRoot = await this.fetchDrive(DRIVE_API_URL, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: DRIVE_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      rootFolderId = createRoot.id;
    }

    // 2. Search for subfolder "Plan2Milestone" inside .AppData.SmartTrack
    const subQuery = encodeURIComponent(
      `name = '${APP_SUBFOLDER_NAME}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const subResult = await this.fetchDrive(
      `${DRIVE_API_URL}?q=${subQuery}&fields=files(id,name)`,
      accessToken
    );

    let subfolderId: string;
    if (subResult.files && subResult.files.length > 0) {
      subfolderId = subResult.files[0].id;
    } else {
      // Create Plan2Milestone subfolder
      const createSub = await this.fetchDrive(DRIVE_API_URL, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: APP_SUBFOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId],
        }),
      });
      subfolderId = createSub.id;
    }

    return { rootFolderId, subfolderId };
  }

  /**
   * Search for existing json file inside subfolder
   */
  public static async findDataFile(
    accessToken: string,
    subfolderId: string
  ): Promise<string | null> {
    const query = encodeURIComponent(
      `name = '${FILE_NAME}' and '${subfolderId}' in parents and trashed = false`
    );
    const result = await this.fetchDrive(
      `${DRIVE_API_URL}?q=${query}&fields=files(id,name,modifiedTime)`,
      accessToken
    );

    if (result.files && result.files.length > 0) {
      return result.files[0].id;
    }
    return null;
  }

  /**
   * Saves or updates data payload to Drive
   */
  public static async saveToDrive(
    accessToken: string,
    data: SmartTrackAppData,
    existingFileId?: string,
    subfolderId?: string
  ): Promise<{ fileId: string; syncedAt: string }> {
    let targetSubfolderId = subfolderId;
    if (!targetSubfolderId) {
      const folderStructure = await this.ensureAppFolderStructure(accessToken);
      targetSubfolderId = folderStructure.subfolderId;
    }

    let fileId = existingFileId;
    if (!fileId) {
      fileId = await this.findDataFile(accessToken, targetSubfolderId) || undefined;
    }

    const contentString = JSON.stringify(data, null, 2);
    const syncedAt = new Date().toISOString();

    if (fileId) {
      // Update existing file using multipart upload or media upload
      const updateUrl = `${UPLOAD_API_URL}/${fileId}?uploadType=media`;
      await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: contentString,
      });
      return { fileId, syncedAt };
    } else {
      // Create new file with metadata in subfolder
      const boundary = 'smarttrack_boundary_' + Date.now();
      const metadata = {
        name: FILE_NAME,
        mimeType: 'application/json',
        parents: [targetSubfolderId],
      };

      const multipartRequestBody =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${contentString}\r\n` +
        `--${boundary}--`;

      const response = await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create file in Drive: ${errorText}`);
      }

      const fileResult = await response.json();
      return { fileId: fileResult.id, syncedAt };
    }
  }

  /**
   * Loads data payload from Drive
   */
  public static async loadFromDrive(
    accessToken: string,
    fileId: string
  ): Promise<SmartTrackAppData> {
    const downloadUrl = `${DRIVE_API_URL}/${fileId}?alt=media`;
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download data from Google Drive: ${response.statusText}`);
    }

    const json = await response.json();
    return json as SmartTrackAppData;
  }
}
