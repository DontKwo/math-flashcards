export interface WorkerRequestMessage {
  type: 'generate-pdf';
  docModel: unknown;
}

export interface WorkerProgressMessage {
  type: 'progress';
  current: number;
  total: number;
  phase: string;
}

export interface WorkerSuccessMessage {
  type: 'success';
  pdfBytes: Uint8Array;
}

export interface WorkerErrorMessage {
  type: 'error';
  error: string;
}

export type WorkerResponseMessage = WorkerProgressMessage | WorkerSuccessMessage | WorkerErrorMessage;

// In worker context
self.onmessage = async (e: MessageEvent<WorkerRequestMessage>) => {
  if (e.data.type === 'generate-pdf') {
    try {
      const { writeDocumentToPdf } = await import('./pdf-writer.ts');
      const pdfBytes = await writeDocumentToPdf(e.data.docModel as import('@formulaflash/core').DocumentModel, {
        onProgress: (current, total, phase) => {
          self.postMessage({ type: 'progress', current, total, phase });
        },
      });

      self.postMessage({ type: 'success', pdfBytes });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: 'error', error: msg });
    }
  }
};
