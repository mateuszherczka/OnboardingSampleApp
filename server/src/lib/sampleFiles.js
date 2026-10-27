const fs = require('fs');
const path = require('path');
const { parseCsv } = require('./csv');

const SAMPLE_DIR = path.resolve(__dirname, '../../../sample-data');
const SAMPLE_FILES = ['clients', 'contacts', 'chart_of_accounts', 'transactions'];

// Allowlist instead of path sanitizing: only real customer folders and known file names ever reach fs.
function sampleCustomers() {
  return fs.readdirSync(SAMPLE_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

function readSampleFile(customer, file, limit = 10) {
  if (!sampleCustomers().includes(customer) || !SAMPLE_FILES.includes(file)) return null;
  const [columns = [], ...rows] = parseCsv(fs.readFileSync(path.join(SAMPLE_DIR, customer, `${file}.csv`), 'utf8'));
  return { columns, rows: rows.slice(0, limit) };
}

module.exports = { readSampleFile, sampleCustomers, SAMPLE_FILES };
