export interface AlegraPriceListItem {
  idPriceList: string;
  price: number;
}

export interface AlegraItemUpdate {
  name?: string;
  prices?: AlegraPriceListItem[];
}

export interface AlegraClient {
  updateItem(id: string, update: AlegraItemUpdate): Promise<unknown>;
}
