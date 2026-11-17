const LOCALE = 'es-CO';

export function itemNames(catalogName: string, itemName: string): { catalogName: string; itemName: string } {
  const catalog = (catalogName || itemName).trim().toLocaleUpperCase(LOCALE);
  const typed = itemName.trim();
  const typedUpper = typed.toLocaleUpperCase(LOCALE);
  if (!catalog || typedUpper === catalog || !typedUpper.startsWith(catalog)) {
    return { catalogName: catalog, itemName: catalog };
  }
  const extra = sentence(typed.slice(catalog.length));
  return { catalogName: catalog, itemName: extra ? `${catalog} ${extra}` : catalog };
}

function sentence(value: string): string {
  const text = value.trim().toLocaleLowerCase(LOCALE);
  if (!text) {
    return '';
  }
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}
