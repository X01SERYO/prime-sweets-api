export interface InvoiceNumberAllocator {
  allocateNext(): Promise<string>;
}
