const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseCsv } = require('./csv');
const { readSampleFile, sampleCustomers } = require('./sampleFiles');

describe('parseCsv', () => {
  it('parses plain rows and ignores a trailing newline', () => {
    assert.deepStrictEqual(parseCsv('a,b\n1,2\n'), [['a', 'b'], ['1', '2']]);
  });

  it('handles CRLF, BOM, empty fields, quoted commas, newlines and escaped quotes', () => {
    const text = '﻿name,note,x\r\n"Smith, John","said ""hi""\nthen left",\r\n';
    assert.deepStrictEqual(parseCsv(text), [['name', 'note', 'x'], ['Smith, John', 'said "hi"\nthen left', '']]);
  });
});

describe('readSampleFile', () => {
  it('returns columns and at most 10 aligned rows', () => {
    const { columns, rows } = readSampleFile('CustomerA_ABCAccounting', 'clients');
    assert.strictEqual(columns[0], 'Client ID');
    assert.ok(rows.length > 0 && rows.length <= 10);
    rows.forEach(r => assert.strictEqual(r.length, columns.length));
  });

  it('exposes the three sample customers', () => {
    assert.deepStrictEqual(sampleCustomers().sort(), [
      'CustomerA_ABCAccounting', 'CustomerB_XYZFinancialServices', 'CustomerC_PremierBookkeeping'
    ]);
  });

  it('rejects path traversal and unknown names', () => {
    for (const [customer, file] of [
      ['..', 'package'],
      ['../server', 'package'],
      ['CustomerA_ABCAccounting', '../../server/package'],
      ['CustomerA_ABCAccounting', 'clients.csv'],
      ['CustomerA_ABCAccounting/..', 'clients'],
      ['README.md', 'clients']
    ]) {
      assert.strictEqual(readSampleFile(customer, file), null, `${customer}/${file}`);
    }
  });
});
