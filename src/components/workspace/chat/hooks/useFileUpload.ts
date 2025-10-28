import { useState, useCallback } from 'react';
import { uploadFileToStorage } from '@/services/storage';
import type { MessageAttachment } from '@/stores/workspace-store';
import { STORAGE_BUCKET } from '../constants';
import { UI_DELAYS } from '@/lib/constants/timeouts';

export function useFileUpload() {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFiles = useCallback(
    async (channelId: string): Promise<MessageAttachment[] | undefined> => {
      if (attachedFiles.length === 0) return undefined;

      setUploadingFiles(true);
      setUploadProgress(0);

      try {
        const totalBytes = attachedFiles.reduce((sum, file) => sum + file.size, 0);
        let uploadedBytes = 0;

        const results: MessageAttachment[] = [];

        for (const file of attachedFiles) {
          const uploadResult = await uploadFileToStorage(file, {
            bucket: STORAGE_BUCKET,
            folder: channelId,
            onProgress: (progress) => {
              const totalLoaded = uploadedBytes + progress.loaded;
              const percentage = totalBytes === 0
                ? 100
                : Math.round((totalLoaded / totalBytes) * 100);
              setUploadProgress(percentage);
            }
          });

          uploadedBytes += file.size;

          results.push({
            id: uploadResult.id,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
            path: uploadResult.path,
            publicUrl: uploadResult.publicUrl
          });
        }

        setUploadProgress(100);
        return results;
      } catch (error) {
                throw error;
      } finally {
        setUploadingFiles(false);
        setTimeout(() => setUploadProgress(0), UI_DELAYS.AUTO_SAVE);
      }
    },
    [attachedFiles]
  );

  const clearFiles = useCallback(() => {
    setAttachedFiles([]);
    setUploadProgress(0);
  }, []);

  return {
    attachedFiles,
    setAttachedFiles,
    uploadingFiles,
    uploadProgress,
    uploadFiles,
    clearFiles
  };
}
