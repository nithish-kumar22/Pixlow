import type { CatalogPlatform } from '../catalog';

/**
 * Formats the raw user prompt as the user message sent to the LLM.
 * Caller should run validatePrompt(prompt) before generation; this only trims and prefixes.
 *
 * @param prompt - Raw user prompt (will be trimmed).
 * @param platform - Target platform; used to set "Target platform: ..." in the message.
 * @returns Formatted user message string.
 */
export function formatUserMessage(prompt: string, platform: CatalogPlatform): string {
  const trimmed = prompt.trim();
  const platformLabel = platform === 'react-native' ? 'React Native' : platform;
  return `Target platform: ${platformLabel}.\n\nGenerate a mobile app with the following description:\n\n${trimmed}`;
}
