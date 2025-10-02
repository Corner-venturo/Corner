import { supabase } from './client';

/**
 * 清理過期的檔案
 * @param bucket Storage bucket 名稱
 * @param daysToKeep 保留天數
 */
export async function cleanupOldFiles(
  bucket: string = 'workspace-files',
  daysToKeep: number = 90
): Promise<{ deleted: number; errors: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // 列出所有檔案
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      throw listError;
    }

    if (!files || files.length === 0) {
      return { deleted: 0, errors: 0 };
    }

    // 篩選出過期的檔案
    const oldFiles = files.filter(file => {
      const fileDate = new Date(file.created_at);
      return fileDate < cutoffDate;
    });

    if (oldFiles.length === 0) {
      console.log('沒有需要清理的檔案');
      return { deleted: 0, errors: 0 };
    }

    // 刪除過期檔案
    const filePaths = oldFiles.map(file => file.name);
    const { data, error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filePaths);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`成功刪除 ${filePaths.length} 個過期檔案`);
    return { deleted: filePaths.length, errors: 0 };
  } catch (error) {
    console.error('清理檔案失敗:', error);
    return { deleted: 0, errors: 1 };
  }
}

/**
 * 清理特定頻道的過期檔案
 * @param channelId 頻道 ID
 * @param daysToKeep 保留天數
 */
export async function cleanupChannelFiles(
  channelId: string,
  daysToKeep: number = 90
): Promise<void> {
  const bucket = 'workspace-files';
  const folderPath = `channels/${channelId}`;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  // 列出頻道資料夾中的檔案
  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list(folderPath, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'asc' }
    });

  if (error || !files) {
    console.error('列出頻道檔案失敗:', error);
    return;
  }

  // 篩選過期檔案
  const oldFiles = files.filter(file => {
    const fileDate = new Date(file.created_at);
    return fileDate < cutoffDate;
  });

  if (oldFiles.length === 0) {
    return;
  }

  // 刪除過期檔案
  const filePaths = oldFiles.map(file => `${folderPath}/${file.name}`);
  await supabase.storage.from(bucket).remove(filePaths);

  console.log(`頻道 ${channelId} 清理了 ${filePaths.length} 個過期檔案`);
}
