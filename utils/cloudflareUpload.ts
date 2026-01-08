/**
 * Cloudflare Upload Utility
 * 
 * Frontend utility for uploading files to Cloudflare R2 via the backend API.
 * Supports both regular uploads and direct presigned URL uploads.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface UploadResponse {
  success: boolean;
  url: string;
  key: string;
  size: number;
  contentType: string;
  provider: 'cloudflare-r2' | 'local';
  error?: string;
}

export interface MultiUploadResponse {
  success: boolean;
  files: Array<UploadResponse & { originalName: string }>;
}

export interface PresignedUrlResponse {
  success: boolean;
  uploadUrl: string;
  key: string;
  publicUrl: string;
  error?: string;
}

export interface CloudflareStatusResponse {
  r2Configured: boolean;
  provider: 'cloudflare-r2' | 'local';
}

/**
 * Check if Cloudflare R2 is configured
 */
export const checkCloudflareStatus = async (): Promise<CloudflareStatusResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/cloudflare/status`);
    if (!response.ok) {
      throw new Error('Failed to check Cloudflare status');
    }
    return await response.json();
  } catch (error) {
    console.error('Cloudflare status check error:', error);
    return { r2Configured: false, provider: 'local' };
  }
};

/**
 * Upload a single file
 */
export const uploadFile = async (
  file: File,
  options: {
    folder?: string;
    tenantId?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  if (options.tenantId) {
    formData.append('tenantId', options.tenantId);
  }

  try {
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options.onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          options.onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE}/api/cloudflare/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      url: '',
      key: '',
      size: 0,
      contentType: '',
      provider: 'local',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  files: File[],
  options: {
    folder?: string;
    tenantId?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<MultiUploadResponse> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  if (options.tenantId) {
    formData.append('tenantId', options.tenantId);
  }

  try {
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options.onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          options.onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE}/api/cloudflare/upload-multiple`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    return {
      success: false,
      files: [],
    };
  }
};

/**
 * Delete a file
 */
export const deleteFile = async (urlOrKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/cloudflare/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlOrKey.startsWith('http') ? urlOrKey : undefined,
        key: !urlOrKey.startsWith('http') ? urlOrKey : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Get a presigned URL for direct upload (useful for large files)
 */
export const getPresignedUploadUrl = async (
  filename: string,
  contentType: string,
  options: {
    folder?: string;
    tenantId?: string;
  } = {}
): Promise<PresignedUrlResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/cloudflare/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        contentType,
        folder: options.folder,
        tenantId: options.tenantId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Presigned URL error:', error);
    return {
      success: false,
      uploadUrl: '',
      key: '',
      publicUrl: '',
      error: error instanceof Error ? error.message : 'Failed to get presigned URL',
    };
  }
};

/**
 * Upload directly to R2 using presigned URL (bypasses server for large files)
 */
export const uploadDirectToR2 = async (
  file: File,
  options: {
    folder?: string;
    tenantId?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<UploadResponse> => {
  try {
    // Get presigned URL
    const presigned = await getPresignedUploadUrl(file.name, file.type, {
      folder: options.folder,
      tenantId: options.tenantId,
    });

    if (!presigned.success) {
      // Fall back to regular upload if presigned URLs not available
      return uploadFile(file, options);
    }

    // Upload directly to R2
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options.onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          options.onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            url: presigned.publicUrl,
            key: presigned.key,
            size: file.size,
            contentType: file.type,
            provider: 'cloudflare-r2',
          });
        } else {
          reject(new Error(`Direct upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Direct upload failed'));
      });

      xhr.open('PUT', presigned.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('Direct upload error:', error);
    // Fall back to regular upload
    return uploadFile(file, options);
  }
};

export default {
  checkCloudflareStatus,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getPresignedUploadUrl,
  uploadDirectToR2,
};
