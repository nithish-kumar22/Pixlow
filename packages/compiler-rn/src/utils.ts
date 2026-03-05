/**
 * Sanitize screen name to valid PascalCase component name (e.g. "Home" → "Home", "my screen" → "MyScreen").
 */
export function screenNameToComponentName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Screen';
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
