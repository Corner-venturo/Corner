import { supabase } from './client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

/**
 * 上傳檔案到 Supabase Storage
 * @param file 要上傳的檔案
 * @param bucket Storage bucket 名稱（預設：'workspace-files'）
 * @param folder 資料夾路徑（選填）
 * @param onProgress 上傳進度回調
 * @returns 上傳結果包含檔案 URL 和路徑
 */
export async function uploadFile(
  file: File,
  bucket: string = 'workspace-files',
  folder?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // 生成唯一檔名 (避免檔名衝突)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;

    // 組合完整路徑
    const file_path = folder ? `${folder}/${fileName}` : fileName;

    // 模擬進度更新 (Supabase JS 客戶端不直接支援進度追蹤)
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }

    // 上傳檔案
    // cacheControl: 快取時間（秒）
    // 3600 = 1小時, 86400 = 1天, 2592000 = 30天, 7776000 = 90天
    const { error } = await supabase.storage
      .from(bucket)
      .upload(file_path, file, {
        cacheControl: '7776000', // 90 天快取
        upsert: false
      });

    if (error) {
      throw new Error(`檔案上傳失敗: ${error.message}`);
    }

    // 更新進度為完成
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(file_path);

    return {
      url: urlData.publicUrl,
      path: file_path,
      fileName: file.name
    };
  } catch (error) {
    console.error('Upload file error:', error);
    throw error;
  }
}

/**
 * 批次上傳多個檔案
 * @param files 要上傳的檔案陣列
 * @param bucket Storage bucket 名稱
 * @param folder 資料夾路徑
 * @param onProgress 每個檔案的上傳進度回調
 * @returns 上傳結果陣列
 */
export async function uploadFiles(
  files: File[],
  bucket: string = 'workspace-files',
  folder?: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(
      file,
      bucket,
      folder,
      onProgress ? (progress) => onProgress(i, progress) : undefined
    );
    results.push(result);
  }

  return results;
}

/**
 * 刪除檔案
 * @param path 檔案路徑
 * @param bucket Storage bucket 名稱
 */
export async function deleteFile(
  path: string,
  bucket: string = 'workspace-files'
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`檔案刪除失敗: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}

/**
 * 下載檔案
 * @param path 檔案路徑
 * @param bucket Storage bucket 名稱
 * @param fileName 下載時的檔案名稱
 */
export async function downloadFile(
  path: string,
  bucket: string = 'workspace-files',
  fileName?: string
): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new Error(`檔案下載失敗: ${error.message}`);
    }

    // 創建下載連結
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || path.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download file error:', error);
    throw error;
  }
}

/**
 * 獲取檔案的公開 URL
 * @param path 檔案路徑
 * @param bucket Storage bucket 名稱
 * @returns 公開 URL
 */
export function getPublicUrl(
  path: string,
  bucket: string = 'workspace-files'
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * 列出資料夾中的檔案
 * @param folder 資料夾路徑
 * @param bucket Storage bucket 名稱
 */
export async function listFiles(
  folder?: string,
  bucket: string = 'workspace-files'
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`列出檔案失敗: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('List files error:', error);
    throw error;
  }
}
