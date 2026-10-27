const express = require('express');
const cors = require('cors');
const store = require('./data/store');
const { validateCustomerInput } = require('./models');
const { readSampleFile } = require('./lib/sampleFiles');
const { suggestMapping } = require('./lib/autoMap');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all customers
app.get('/api/customers', (req, res) => {
  res.json(store.getCustomers());
});

// Get customer by ID
app.get('/api/customers/:id', (req, res) => {
  const customer = store.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

// Get onboarding state for a customer
app.get('/api/customers/:id/onboarding', (req, res) => {
  const state = store.getOnboardingState(req.params.id);
  if (!state) {
    return res.status(404).json({ error: 'Onboarding state not found' });
  }
  res.json(state);
});

app.post('/api/customers', (req, res) => {
  const { value, errors } = validateCustomerInput(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }
  const customer = store.onboardCustomer(value);
  res.status(201).json({
    ...store.getOnboardingState(customer.id),
    customerName: customer.name,
    customerIndustry: customer.industry,
    customerRegion: customer.region
  });
});

app.get('/api/sample-files/:customer/:file', (req, res) => {
  const data = readSampleFile(req.params.customer, req.params.file);
  if (!data) {
    return res.status(404).json({ error: 'Sample file not found' });
  }
  res.json(data);
});

app.post('/api/mapping/suggest', (req, res) => {
  const { entity, columns } = req.body || {};
  const valid = Array.isArray(columns) && columns.every(c => typeof c === 'string');
  const fields = valid ? suggestMapping(entity, columns) : null;
  if (!fields) {
    return res.status(400).json({ error: 'Body must be { entity: "clients", columns: string[] }' });
  }
  res.json({ fields });
});

app.get('/api/customers/:customerId/mapping', (req, res) => {
  const mapping = store.getMapping(req.params.customerId);
  if (!mapping) {
    return res.status(404).json({ error: 'No mapping saved for this customer' });
  }
  res.json(mapping);
});

app.post('/api/customers/:customerId/mapping', (req, res) => {
  if (!store.getCustomerById(req.params.customerId)) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const { sourceCustomer, entity, fields } = req.body || {};
  const validFields = fields && typeof fields === 'object' && !Array.isArray(fields)
    && Object.values(fields).every(v => typeof v === 'string');
  if (typeof entity !== 'string' || !entity || !validFields) {
    return res.status(400).json({ error: 'Body must be { sourceCustomer, entity, fields: { targetField: sourceColumn } }' });
  }
  res.json(store.saveMapping(req.params.customerId, { sourceCustomer, entity, fields }));
});

const STEP_STATUSES =['pending', 'in_progress', 'completed', 'failed'];

app.patch('/api/customers/:id/onboarding/steps/:stepId', (req, res) => {
  const { status } = req.body || {};
  if (!STEP_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${STEP_STATUSES.join(', ')}` });
  }
  const step = store.getOnboardingState(req.params.id)?.steps.find(s => s.id === req.params.stepId);
  if (step?.automatic) {
    return res.status(409).json({ error: `${step.name} is completed automatically from customer data` });
  }
  const state = store.setStepStatus(req.params.id, req.params.stepId, status);
  if (!state) {
    return res.status(404).json({ error: 'Customer or step not found' });
  }
  res.json(state);
});

// Get all onboarding states (dashboard view)
app.get('/api/onboarding', (req, res) => {
  const states = store.getAllOnboardingStates();
  const customers = store.getCustomers();
  
  // Join customer info with onboarding state
  const dashboard = states.map(state => {
    const customer = customers.find(c => c.id === state.customerId);
    return {
      ...state,
      customerName: customer?.name || 'Unknown',
      customerIndustry: customer?.industry || '',
      customerRegion: customer?.region || ''
    };
  });
  
  res.json(dashboard);
});

// Get tenant by customer ID
app.get('/api/tenants/:customerId', (req, res) => {
  const tenant = store.getTenantByCustomerId(req.params.customerId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Onboarding API server running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
