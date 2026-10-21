export interface InvoiceNumberAllocator {
  allocateNext(businessDate: string): Promise<string>;
}
