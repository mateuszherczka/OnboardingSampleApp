const { describe, it } = require('node:test');
const assert = require('node:assert');
const { suggestMapping } = require('./autoMap');
const { readSampleFile } = require('./sampleFiles');

const EXPECTED = {
  CustomerA_ABCAccounting: {
    id: 'Client ID', name: 'Client Name', entityType: 'Business Type', status: 'Status', startDate: 'Date Onboarded',
    taxId: 'Tax ID', revenue: 'Annual Revenue', industry: 'Industry', paymentTerms: 'Payment Terms'
  },
  CustomerB_XYZFinancialServices: {
    id: 'clientCode', name: 'companyName', entityType: 'entityType', status: 'clientStatus', startDate: 'startDate',
    taxId: 'federalTaxId', revenue: 'yearlyRevenue', industry: 'sectorCode', paymentTerms: 'billingTerms'
  },
  CustomerC_PremierBookkeeping: {
    id: 'customer_id', name: 'business_name', entityType: 'legal_structure', status: 'account_status', startDate: 'registration_date',
    taxId: 'tax_reference', revenue: 'gross_revenue', industry: 'industry_sector', paymentTerms: 'credit_terms'
  }
};

describe('suggestMapping', () => {
  for (const [customer, expected] of Object.entries(EXPECTED)) {
    it(`maps all 9 client fields for ${customer}`, () => {
      const { columns } = readSampleFile(customer, 'clients');
      assert.deepStrictEqual(suggestMapping('clients', columns), expected);
    });
  }

  it('matches regardless of case and separators, leaves unknown headers unmapped, never reuses a column', () => {
    const fields = suggestMapping('clients', ['CLIENT-ID', 'Turnover', 'Favourite Colour', 'status', 'Client Status']);
    assert.strictEqual(fields.id, 'CLIENT-ID');
    assert.strictEqual(fields.revenue, 'Turnover');
    assert.strictEqual(fields.status, 'status');
    assert.strictEqual(fields.name, '');
    assert.ok(!Object.values(fields).includes('Favourite Colour'));
  });

  it('returns null for an unknown entity', () => {
    assert.strictEqual(suggestMapping('invoices', ['id']), null);
  });
});
