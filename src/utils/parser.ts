// Command parser utility - kept for backwards compatibility
export function parseCommand(text: string): { command: string; args: string[] } | null {
  const trimmed = text.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 0) return null;
  return { command: parts[0], args: parts.slice(1) };
}
