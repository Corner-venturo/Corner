import { downloadFile as downloadFileByUrl } from '@/lib/files';
import {
  getPublicUrlFromStorage,
  listFilesInStorage,
  removeFileFromStorage,
  uploadFileToStorage,
  uploadFilesToStorage,
  type StorageUploadProgress,
  type StorageUploadResult,
} from '@/services/storage';

export type { StorageUploadProgress, StorageUploadResult };

export const uploadFile = uploadFileToStorage;
export const uploadFiles = uploadFilesToStorage;
export const deleteFile = removeFileFromStorage;
export const getPublicUrl = getPublicUrlFromStorage;
export const listFiles = listFilesInStorage;

export async function downloadFile(
  path: string,
  bucket: string = 'workspace-files',
  fileName?: string,
) {
  const publicUrl = getPublicUrlFromStorage(path, bucket);
  const resolvedName = fileName ?? path.split('/').pop() ?? 'download';
  await downloadFileByUrl(publicUrl, resolvedName);
}
