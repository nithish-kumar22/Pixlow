import type { CatalogPlatform } from '../catalog';
import { getCatalogForPrompt } from '../catalog';
import { getSampleIR } from '../sampleIR';

/** Hand-written IR schema summary for the system prompt (M05-aligned). */
const IR_SCHEMA_SUMMARY = `Output JSON must have this shape:
- version (string), appId? (string)
- screens: array of { id (string), name (string), layout (single root node) }
- layout nodes: id (string), type (string, one of View, Text, Image, Button, TextInput, FlatList, ScrollView, SafeAreaView), props (object), style (object), children? (array of nodes), events? (e.g. onPress: { action, target? })
- navigation: { type: 'stack' | 'tabs', initialScreen (screen id) }
- theme: { primaryColor?, fontFamily? }
- dataBindings? (object), assets? (array)`;

const DESIGN_RULES = `Design rules:
- Each screen has exactly one root layout node (typically View or SafeAreaView).
- Every screen and every layout node must have a unique string id.
- Use only component types listed in the component catalog below.
- navigation.initialScreen must be the id of one of the screens.`;

const ROLE_AND_FORMAT = `You are a mobile app generator that outputs a single JSON object representing the app structure (Intermediate Representation). Respond with ONLY valid JSON. No markdown, no code fences, no explanation before or after.`;

export type BuildSystemPromptOptions = {
  includeExample?: boolean;
};

/**
 * Builds the system prompt for the LLM: role, output format, IR schema summary,
 * design rules, component catalog, and optionally a sample IR example.
 * Used by M08 (LLM integration); Python API may port this logic.
 *
 * @param platform - Target platform (e.g. 'react-native'); catalog is chosen by this.
 * @param options - includeExample: if true, appends one minimal IR JSON example from M05 sample.
 * @returns Full system prompt string.
 */
export function buildSystemPrompt(
  platform: CatalogPlatform,
  options?: BuildSystemPromptOptions
): string {
  const sections: string[] = [];

  sections.push(ROLE_AND_FORMAT);
  sections.push('');
  sections.push('JSON schema (required keys and types):');
  sections.push(IR_SCHEMA_SUMMARY);
  sections.push('');
  sections.push(DESIGN_RULES);
  sections.push('');
  sections.push(getCatalogForPrompt(platform));

  if (options?.includeExample === true) {
    sections.push('');
    sections.push('Example structure (follow this shape):');
    sections.push(JSON.stringify(getSampleIR(), null, 2));
  }

  return sections.join('\n');
}
