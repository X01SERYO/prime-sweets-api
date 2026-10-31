const LOCALE = 'es-CO';

export function saleItemNames(catalogName: string, itemName: string): { catalogName: string; itemName: string } {
  const catalog = (catalogName || itemName).trim().toLocaleUpperCase(LOCALE);
  const typed = itemName.trim();
  const typedUpper = typed.toLocaleUpperCase(LOCALE);
  if (!catalog || typedUpper === catalog || !typedUpper.startsWith(catalog)) {
    return { catalogName: catalog, itemName: catalog };
  }
  const extra = typed.slice(catalog.length).trim().toLocaleLowerCase(LOCALE);
  return { catalogName: catalog, itemName: extra ? `${catalog} ${extra}` : catalog };
}
