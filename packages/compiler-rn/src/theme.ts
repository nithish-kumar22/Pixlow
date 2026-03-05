import type { AppIR } from '@pixlow/ir';

/** Generate theme.ts exporting design tokens from ir.theme. */
export function generateThemeTs(ir: AppIR): string {
  const theme = ir.theme ?? {};
  const primaryColor = theme.primaryColor ?? '#6366f1';
  const fontFamily = theme.fontFamily ?? 'System';

  return `/**
 * Theme tokens generated from IR.
 */
export const theme = {
  primaryColor: '${String(primaryColor).replace(/'/g, "\\'")}',
  fontFamily: '${String(fontFamily).replace(/'/g, "\\'")}',
};
`;
}
