/**
 * Hook to derive Sandpack files from IR with debounce and compile (M11).
 * Used by Preview when ir prop is provided; debounces 300ms to avoid excessive recompiles.
 */

import { useState, useEffect, useMemo } from 'react';
import type { AppIR } from '@pixlow/ir';
import { compileIRToReactNativeSync, type FileTree } from '@pixlow/compiler-rn/sync';
import { fileTreeToSandpackFiles } from './fileTreeToSandpackFiles';
import type { SandpackFiles } from './fileTreeToSandpackFiles';

const DEBOUNCE_MS = 300;

export type UsePreviewFromIRResult = {
  files: SandpackFiles | null;
  error: string | null;
  isLoading: boolean;
};

/**
 * Returns Sandpack-ready files and error state from AppIR.
 * Compiles IR to FileTree then transforms to Sandpack files; debounces updates.
 */
export function usePreviewFromIR(ir: AppIR | null): UsePreviewFromIRResult {
  const [files, setFiles] = useState<SandpackFiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const irKey = ir ? JSON.stringify(ir) : null;

  useEffect(() => {
    if (!ir) {
      setFiles(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      try {
        const fileTree: FileTree = compileIRToReactNativeSync(ir);
        const sandpackFiles = fileTreeToSandpackFiles(fileTree);
        setFiles(sandpackFiles);
        setError(null);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        setFiles(null);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // irKey is stable when IR content is unchanged; using ir would trigger on reference change only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [irKey]);

  return useMemo(
    () => ({ files, error, isLoading }),
    [files, error, isLoading]
  );
}
