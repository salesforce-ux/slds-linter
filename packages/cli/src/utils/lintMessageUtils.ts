export function normalizeLintMessage(msg: string): { message: string, suggestions?: string[] } {
  try {
    const parsed = JSON.parse(msg);
    if (typeof parsed === 'object' && parsed.message) {
      return parsed;
    }
  } catch {}
  return { message: msg };
} 