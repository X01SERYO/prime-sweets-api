import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerateInvoiceUseCase } from './generateInvoice.useCase';
import { InvoiceSaleQuery, InvoiceSaleView } from '../../ports/outbound/invoiceSaleQuery.port';
import { InvoiceCustomerQuery } from '../../ports/outbound/invoiceCustomerQuery.port';
import { CompanyProfileQuery } from '../../ports/outbound/companyProfileQuery.port';
import { InvoiceCompanyProfile } from '../../../domain/entities/invoiceDocument';
import { SaleNotFoundForInvoiceError } from '../../../domain/errors/saleNotFoundForInvoice.error';
import { SaleNotInvoiceableError } from '../../../domain/errors/saleNotInvoiceable.error';
import { CustomerNotFoundForInvoiceError } from '../../../domain/errors/customerNotFoundForInvoice.error';
import { CompanyProfileNotConfiguredError } from '../../../domain/errors/companyProfileNotConfigured.error';

const company: InvoiceCompanyProfile = {
  name: 'Configured Company',
  nit: '900',
  city: 'Cali',
  country: 'Colombia',
  telephone: '300',
  logo: 'logo-ref',
  legalText: 'Configured legal text'
};

function sale(status: InvoiceSaleView['status'] = 'CONFIRMED'): InvoiceSaleView {
  return {
    id: 's-1',
    customerId: 'c-1',
    status,
    invoiceNumber: status === 'DRAFT' ? null : 'INV-00001',
    confirmedAt: status === 'DRAFT' ? null : '2026-10-13T15:00:00.000Z',
    lines: [{ productId: 'p-1', itemName: 'Custom label', quantity: 2, unitValue: 1000, totalValue: 2000 }]
  };
}

function setup(current: InvoiceSaleView | null, options?: { customer?: boolean; company?: boolean }) {
  const invoiceSaleQuery: InvoiceSaleQuery = {
    async findById() {
      return current;
    }
  };
  const invoiceCustomerQuery: InvoiceCustomerQuery = {
    async findById() {
      if (options?.customer === false) return null;
      return { documentType: 'CC', documentNumber: '123', name: 'Ada' };
    }
  };
  const companyProfileQuery: CompanyProfileQuery = {
    async get() {
      return options?.company === false ? null : company;
    }
  };

  return new GenerateInvoiceUseCase(invoiceSaleQuery, invoiceCustomerQuery, companyProfileQuery);
}

test('GenerateInvoiceUseCase - renders a confirmed sale without allocating a new number', async () => {
  const useCase = setup(sale('CONFIRMED'));

  const result = await useCase.run({ saleId: 's-1' });

  assert.equal(result.isSuccess, true);
  assert.equal(result.value?.invoiceNumber, 'INV-00001');
  assert.equal(result.value?.lines[0].productName, 'Custom label');
  assert.equal(result.value?.customerName, 'Ada');
  assert.equal(result.value?.companyName, 'Configured Company');
});

test('GenerateInvoiceUseCase - rejects a draft and a voided sale', async () => {
  const draft = await setup(sale('DRAFT')).run({ saleId: 's-1' });
  const voided = await setup(sale('VOIDED')).run({ saleId: 's-1' });

  assert.ok(draft.error instanceof SaleNotInvoiceableError);
  assert.ok(voided.error instanceof SaleNotInvoiceableError);
});

test('GenerateInvoiceUseCase - fails when the sale does not exist', async () => {
  const result = await setup(null).run({ saleId: 'missing' });

  assert.ok(result.error instanceof SaleNotFoundForInvoiceError);
});

test('GenerateInvoiceUseCase - fails when the customer does not exist', async () => {
  const result = await setup(sale('CONFIRMED'), { customer: false }).run({ saleId: 's-1' });

  assert.ok(result.error instanceof CustomerNotFoundForInvoiceError);
});

test('GenerateInvoiceUseCase - fails when the company profile is not configured', async () => {
  const result = await setup(sale('CONFIRMED'), { company: false }).run({ saleId: 's-1' });

  assert.ok(result.error instanceof CompanyProfileNotConfiguredError);
});
