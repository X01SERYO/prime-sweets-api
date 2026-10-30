export function formatProductCode(brandCode: string, sequence: number): string {
  const prefix = brandCode.trim().toUpperCase();
  const safeSequence = Number.isInteger(sequence) && sequence > 0 ? sequence : 1;
  return `${prefix}${String(safeSequence).padStart(3, '0')}`;
}
