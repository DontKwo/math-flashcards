import { Capacitor } from '@capacitor/core';
import type { DocumentModel } from '@formulaflash/core';
import type { WorkerResponseMessage, WorkerSuccessMessage, WorkerProgressMessage } from './pdf-worker.ts';

export interface ExportProgress {
  current: number;
  total: number;
  phase: string;
}

export interface ExportRunnerCallbacks {
  onProgress?: (p: ExportProgress) => void;
  onSuccess?: (pdfBytes: Uint8Array, filename: string) => void;
  onError?: (err: Error) => void;
}

/**
 * Downloads a file on the web platform via a temporary blob anchor.
 */
export function downloadPdfWeb(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Saves and opens/shares a PDF file inside the Android Capacitor shell.
 */
export async function sharePdfNative(pdfBytes: Uint8Array, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Base64 encode for data URL sharing
      let binary = '';
      const len = pdfBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(pdfBytes[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:application/pdf;base64,${base64}`;

      if (navigator.share) {
        await navigator.share({
          title: filename,
          url: dataUrl,
        });
        return;
      }
    } catch (nativeErr) {
      console.warn('Native share failed, falling back to download:', nativeErr);
    }
  }

  // Fallback to web download
  downloadPdfWeb(pdfBytes, filename);
}

/**
 * Generates a PDF either via Web Worker (to prevent freezing) or on the main thread.
 */
export function generatePdfAsync(
  docModel: DocumentModel,
  callbacks: ExportRunnerCallbacks
): { cancel: () => void } {
  let cancelled = false;
  let worker: Worker | null = null;

  const cancel = (): void => {
    cancelled = true;
    if (worker) {
      worker.terminate();
      worker = null;
    }
    callbacks.onError?.(new Error('Export cancelled by user'));
  };

  const sanitizeName = (docModel.title || 'CheatSheet')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeName}_${dateStr}.pdf`;

  // Try Web Worker if supported
  if (typeof Worker !== 'undefined') {
    try {
      worker = new Worker(new URL('./pdf-worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e: MessageEvent<WorkerResponseMessage>) => {
        if (cancelled) return;
        const data = e.data;
        if (data.type === 'progress') {
          const prog = data as WorkerProgressMessage;
          callbacks.onProgress?.({
            current: prog.current,
            total: prog.total,
            phase: prog.phase,
          });
        } else if (data.type === 'success') {
          const success = data as WorkerSuccessMessage;
          callbacks.onSuccess?.(success.pdfBytes, filename);
          worker?.terminate();
          worker = null;
        } else if (data.type === 'error') {
          callbacks.onError?.(new Error(data.error));
          worker?.terminate();
          worker = null;
        }
      };

      worker.onerror = () => {
        // Fallback to main thread
        worker?.terminate();
        worker = null;
        runMainThread();
      };

      worker.postMessage({ type: 'generate-pdf', docModel });
      return { cancel };
    } catch {
      // Fall through to main thread
    }
  }

  const runMainThread = async (): Promise<void> => {
    try {
      const { writeDocumentToPdf } = await import('./pdf-writer.ts');
      const pdfBytes = await writeDocumentToPdf(docModel, {
        onProgress: (current, total, phase) => {
          if (!cancelled) {
            callbacks.onProgress?.({ current, total, phase });
          }
        },
        cancelSignal: { cancelled },
      });
      if (!cancelled) {
        callbacks.onSuccess?.(pdfBytes, filename);
      }
    } catch (err) {
      if (!cancelled) {
        callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  runMainThread();
  return { cancel };
}
