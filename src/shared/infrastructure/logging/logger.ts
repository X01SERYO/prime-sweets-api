export type LogLevel = 'info' | 'warn' | 'error';

export function log(level: LogLevel, event: string, fields: Record<string, string | number | boolean | null> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields
  });
  if (level === 'error') {
    console.error(line);
    return;
  }
  console.log(line);
}
