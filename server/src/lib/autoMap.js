const normalize = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// Normalized header names seen per target field; extend when a new customer schema shows up.
const TARGET_SCHEMAS = {
  clients: {
    id: ['id', 'clientid', 'clientcode', 'customerid', 'customercode', 'accountid'],
    name: ['name', 'clientname', 'companyname', 'businessname', 'customername', 'legalname'],
    entityType: ['entitytype', 'businesstype', 'legalstructure', 'companytype', 'legalform'],
    status: ['status', 'clientstatus', 'accountstatus', 'customerstatus'],
    startDate: ['startdate', 'dateonboarded', 'registrationdate', 'onboardeddate', 'createddate'],
    taxId: ['taxid', 'federaltaxid', 'taxreference', 'taxnumber', 'vatnumber', 'ein'],
    revenue: ['revenue', 'annualrevenue', 'yearlyrevenue', 'grossrevenue', 'turnover'],
    industry: ['industry', 'sectorcode', 'industrysector', 'sector'],
    paymentTerms: ['paymentterms', 'billingterms', 'creditterms', 'terms']
  }
};

function suggestMapping(entity, columns) {
  const schema = TARGET_SCHEMAS[entity];
  if (!schema) return null;
  const used = new Set();
  const fields = {};
  for (const [field, names] of Object.entries(schema)) {
    const column = columns.find(c => !used.has(c) && names.includes(normalize(c)));
    fields[field] = column || '';
    if (column) used.add(column);
  }
  return fields;
}

module.exports = { suggestMapping, TARGET_SCHEMAS };
