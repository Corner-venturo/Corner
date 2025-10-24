import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface StorageUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface StorageUploadOptions {
  bucket?: string;
  folder?: string;
  onProgress?: (progress: StorageUploadProgress) => void;
}

export interface StorageUploadResult {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  path: string;
  publicUrl: string;
}

const DEFAULT_BUCKET = 'workspace-files';

function buildFilePath(fileName: string, folder?: string) {
  return folder ? `${folder}/${fileName}` : fileName;
}

function createUniqueFileName(originalName: string) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.includes('.') ? originalName.split('.').pop() : undefined;
  return ext ? `${timestamp}_${randomStr}.${ext}` : `${timestamp}_${randomStr}`;
}

/**
 * 上傳檔案至 Supabase Storage 並取得公開連結
 */
export async function uploadFileToStorage(
  file: File,
  options: StorageUploadOptions = {}
): Promise<StorageUploadResult> {
  const { bucket = DEFAULT_BUCKET, folder, onProgress } = options;

  const uniqueFileName = createUniqueFileName(file.name);
  const storagePath = buildFilePath(uniqueFileName, folder);

  onProgress?.({ loaded: 0, total: file.size, percentage: 0 });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      cacheControl: '7776000',
      upsert: false,
    });

  if (error) {
    throw new Error(`檔案上傳失敗: ${error.message}`);
  }

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100 });

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return {
    id: uuidv4(),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    path: storagePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

export interface UploadMultipleOptions extends Omit<StorageUploadOptions, 'onProgress'> {
  onFileProgress?: (fileIndex: number, progress: StorageUploadProgress) => void;
}

export async function uploadFilesToStorage(
  files: File[],
  options: UploadMultipleOptions = {}
): Promise<StorageUploadResult[]> {
  const { onFileProgress, ...singleOptions } = options;
  const results: StorageUploadResult[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const result = await uploadFileToStorage(file, {
      ...singleOptions,
      onProgress: progress => onFileProgress?.(index, progress),
    });
    results.push(result);
  }

  return results;
}

export async function removeFileFromStorage(path: string, bucket: string = DEFAULT_BUCKET) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`檔案刪除失敗: ${error.message}`);
  }
}

export function getPublicUrlFromStorage(path: string, bucket: string = DEFAULT_BUCKET) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function listFilesInStorage(folder?: string, bucket: string = DEFAULT_BUCKET) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`列出檔案失敗: ${error.message}`);
  }

  return data ?? [];
}
