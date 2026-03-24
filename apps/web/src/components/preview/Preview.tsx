'use client';

/**
 * In-browser preview for generated React Native app (M11).
 * Renders M09 compiler output in Sandpack with a react-native stub so the app runs in the browser.
 * MVP: React Native only; single-screen preview (no React Navigation in sandbox).
 * Compilation errors are shown in-place; Sandpack runtime errors appear in the preview iframe or browser console.
 */

import React, { useMemo } from 'react';
import {
  Sandpack,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from '@codesandbox/sandpack-react';
import type { AppIR } from '@pixlow/ir';
import type { FileTree } from '@pixlow/compiler-rn/sync';
import { fileTreeToSandpackFiles } from './fileTreeToSandpackFiles';
import { usePreviewFromIR } from './usePreviewFromIR';

const SANDPACK_ENTRY = '/index.js';

export type PreviewProps = {
  /** Pre-compiled FileTree from M09 (e.g. compileIRToReactNative). */
  files?: FileTree | null;
  /** If provided, compile IR and preview; takes precedence over files. */
  ir?: AppIR | null;
  /** Logical entry (default App.tsx). Sandpack actually runs /index.js which mounts the initial screen. */
  entry?: string;
  className?: string;
  /** Dark preview-only layout for the builder workspace. */
  variant?: "default" | "builder";
};

/**
 * Preview component: accepts FileTree or AppIR and renders in Sandpack.
 * When ir is provided, compiles and debounces 300ms. When files is provided, transforms and shows immediately.
 */
export function Preview({ files: filesProp, ir, className, variant = "default" }: PreviewProps) {
  const fromIR = usePreviewFromIR(ir ?? null);

  const { sandpackFiles, compileError, isLoading } = useMemo(() => {
    if (ir != null) {
      if (fromIR.error) {
        return { sandpackFiles: null, compileError: fromIR.error, isLoading: fromIR.isLoading };
      }
      return {
        sandpackFiles: fromIR.files,
        compileError: null,
        isLoading: fromIR.isLoading,
      };
    }
    if (filesProp && Object.keys(filesProp).length > 0) {
      try {
        const transformed = fileTreeToSandpackFiles(filesProp);
        return { sandpackFiles: transformed, compileError: null, isLoading: false };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { sandpackFiles: null, compileError: message, isLoading: false };
      }
    }
    return { sandpackFiles: null, compileError: null, isLoading: false };
  }, [ir, filesProp, fromIR.files, fromIR.error, fromIR.isLoading]);

  if (compileError) {
    return (
      <div
        className={className}
        style={{
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--preview-error-bg, #fef2f2)',
          color: 'var(--preview-error-text, #b91c1c)',
          borderRadius: 8,
          border: '1px solid var(--preview-error-border, #fecaca)',
        }}
        role="alert"
      >
        <div>
          <strong>Preview unavailable</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>{compileError}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--preview-loading-bg, #f8fafc)',
          color: 'var(--preview-loading-text, #64748b)',
          borderRadius: 8,
        }}
      >
        Generating preview…
      </div>
    );
  }

  if (!sandpackFiles || Object.keys(sandpackFiles).length === 0) {
    return (
      <div
        className={className}
        style={{
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--preview-empty-bg, #f1f5f9)',
          color: 'var(--preview-empty-text, #64748b)',
          borderRadius: 8,
        }}
      >
        Describe your app and click Generate to see the preview.
      </div>
    );
  }

  const isBuilder = variant === "builder";

  if (isBuilder) {
    const rootClass = [className, "preview-sandpack-builder"].filter(Boolean).join(" ");
    return (
      <div className={rootClass} style={{ height: "100%", minHeight: 0 }}>
        <SandpackProvider
          template="react"
          files={sandpackFiles}
          customSetup={{
            entry: SANDPACK_ENTRY,
          }}
          theme="dark"
          className="preview-sandpack-builder__provider"
          options={{
            classes: {
              "sp-wrapper": "preview-sandpack-builder__sp-wrapper",
              "sp-layout": "preview-sandpack-builder__sp-layout",
            },
          }}
        >
          <SandpackLayout className="preview-sandpack-builder__sandpack-layout">
            <SandpackPreview
              showNavigator={false}
              showOpenInCodeSandbox={false}
              showRefreshButton
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    );
  }

  return (
    <div className={className} style={{ minHeight: 400 }}>
      <Sandpack
        template="react"
        files={sandpackFiles}
        customSetup={{
          entry: SANDPACK_ENTRY,
        }}
        options={{
          layout: "preview",
          editorHeight: 280,
          editorWidthPercentage: 50,
        }}
        theme="light"
      />
    </div>
  );
}
