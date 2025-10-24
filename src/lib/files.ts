interface DownloadFileOptions {
  retries?: number;
  onError?: (error: unknown) => void;
}

function wait(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

export async function downloadFile(url: string, fileName: string, options: DownloadFileOptions = {}) {
  const { retries = 2, onError } = options;

  if (typeof window === 'undefined') {
    throw new Error('下載功能僅可在瀏覽器環境使用');
  }

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`下載失敗: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
      return;
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt > retries) {
        console.error('下載檔案失敗:', error);
        onError?.(error);
        alert('檔案下載失敗，請稍後再試。');
        throw error;
      }

      await wait(500 * attempt);
    }
  }

  if (lastError) {
    throw lastError;
  }
}
