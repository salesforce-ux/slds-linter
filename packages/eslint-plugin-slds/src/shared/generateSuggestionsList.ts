// Simple utility to join suggestions for reporting
export default function generateSuggestionsList(suggestions: string[]): string {
  if (!suggestions || suggestions.length === 0) return '';
  if (suggestions.length === 1) return suggestions[0];
  return suggestions.slice(0, -1).join(', ') + ' or ' + suggestions[suggestions.length - 1];
} 