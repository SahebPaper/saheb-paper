import { supabase } from '../lib/supabase';

export interface CloudDocumentUrls {
  downloadUrl: string;
  viewUrl: string;
}

/**
 * Uploads a document (PDF / Excel) to Supabase Storage in the 'documents' public bucket.
 * Returns both the direct force-download URL (with Content-Disposition: attachment)
 * and the inline viewer URL.
 */
export async function uploadDocumentToCloud(
  blob: Blob,
  filename: string
): Promise<CloudDocumentUrls | null> {
  if (!supabase) {
    console.warn('[CloudStorage] Supabase client is not configured.');
    return null;
  }

  try {
    const contentType = blob.type || (filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    
    // Upload with timestamped path and cacheControl: '0' to prevent CDN / browser stale caching
    const timestamp = Date.now();
    const cleanExt = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
    const baseName = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    const storagePath = `${baseName}_${timestamp}${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, blob, {
        upsert: true,
        contentType,
        cacheControl: '0',
      });

    if (uploadError) {
      console.warn('[CloudStorage] Upload failed:', uploadError);
      return null;
    }

    // Direct download URL: instructs browser & Android DownloadManager to save directly with original filename
    const { data: downloadData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath, { download: filename });

    // Inline view URL: for viewing in browser tab / PDF viewer
    const { data: viewData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    return {
      downloadUrl: downloadData.publicUrl,
      viewUrl: viewData.publicUrl,
    };
  } catch (err) {
    console.warn('[CloudStorage] Error during cloud document upload:', err);
    return null;
  }
}

/**
 * Triggers a real HTTPS file download through Android's native DownloadManager.
 * Because the URL comes from Supabase with Content-Disposition: attachment,
 * mobile Chrome / PWA / Android OS delegates it directly to the system DownloadManager,
 * saving the file straight into /storage/emulated/0/Download/ and indexing it in File Manager.
 */
export function triggerCloudDownload(downloadUrl: string, filename: string): void {
  try {
    const a = document.createElement('a');
    const separator = downloadUrl.includes('?') ? '&' : '?';
    a.href = `${downloadUrl}${separator}nocache=${Date.now()}`;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      } catch {
        // ignore
      }
    }, 2000);
  } catch (err) {
    console.warn('[CloudStorage] Anchor click failed, trying location assign:', err);
    window.location.assign(downloadUrl);
  }
}

/**
 * High-level helper: Uploads PDF to Supabase, then triggers instant native Android download.
 */
export async function downloadPdfViaCloud(blob: Blob, filename: string): Promise<boolean> {
  try {
    const cloudUrls = await uploadDocumentToCloud(blob, filename);
    if (cloudUrls?.downloadUrl) {
      triggerCloudDownload(cloudUrls.downloadUrl, filename);
      return true;
    }
  } catch (cloudErr) {
    console.warn('[CloudStorage] Cloud download route failed:', cloudErr);
  }
  return false;
}
