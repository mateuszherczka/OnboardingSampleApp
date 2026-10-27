/**
 * In-Memory Data Store
 * Simple storage for the training exercise - no database needed
 */

const { createCustomer, createTenant, createDefaultOnboardingSteps, calculateProgress } = require('../models');

const SAMPLE_CUSTOMERS = [
  { id: 'cust_002', name: 'ABC Accounting', industry: 'Accounting', region: 'North America', contactEmail: 'onboarding@abc.example.com' },
  { id: 'cust_003', name: 'XYZ Financial Services', industry: 'Financial Services', region: 'North America', contactEmail: 'onboarding@xyz.example.com' },
  { id: 'cust_004', name: 'Premier Bookkeeping', industry: 'Bookkeeping', region: 'United Kingdom', contactEmail: 'onboarding@premier.example.com' }
];

// In-memory storage
const store = {
  customers: [],
  tenants: [],
  onboardingStates: []
};

// Seed with example data
function seedData() {
  // Example customer - Acme Corporation
  const exampleCustomer = createCustomer({
    id: 'cust_001',
    name: 'Acme Corporation',
    industry: 'Manufacturing',
    region: 'North America',
    contactEmail: 'onboarding@acme.example.com',
    createdAt: '2025-01-15T10:00:00Z'
  });

  // Example tenant for Acme
  const exampleTenant = createTenant({
    id: 'tenant_001',
    customerId: 'cust_001',
    status: 'pending',
    plan: 'professional',
    createdAt: '2025-01-15T10:00:00Z'
  });

  // Example onboarding state - just started, nothing completed
  const exampleOnboardingState = {
    customerId: 'cust_001',
    steps: createDefaultOnboardingSteps(),
    progressPercent: 0
  };

  store.customers.push(exampleCustomer);
  store.tenants.push(exampleTenant);
  store.onboardingStates.push(exampleOnboardingState);

  SAMPLE_CUSTOMERS.forEach((data, i) => {
    const createdAt = '2025-02-01T10:00:00Z';
    store.customers.push(createCustomer({ ...data, createdAt }));
    store.tenants.push(createTenant({ id: `tenant_00${i + 2}`, customerId: data.id, status: 'pending', plan: 'professional', createdAt }));
    store.onboardingStates.push({ customerId: data.id, steps: createDefaultOnboardingSteps(), progressPercent: 0 });
  });
}

// Initialize with seed data
seedData();

// Store access functions
function getCustomers() {
  return [...store.customers];
}

function getCustomerById(id) {
  return store.customers.find(c => c.id === id);
}

function addCustomer(customer) {
  store.customers.push(customer);
  return customer;
}

function getTenants() {
  return [...store.tenants];
}

function getTenantByCustomerId(customerId) {
  return store.tenants.find(t => t.customerId === customerId);
}

function addTenant(tenant) {
  store.tenants.push(tenant);
  return tenant;
}

function getOnboardingState(customerId) {
  return store.onboardingStates.find(s => s.customerId === customerId);
}

function getAllOnboardingStates() {
  return [...store.onboardingStates];
}

function addOnboardingState(state) {
  store.onboardingStates.push(state);
  return state;
}

function updateOnboardingState(customerId, updates) {
  const index = store.onboardingStates.findIndex(s => s.customerId === customerId);
  if (index !== -1) {
    store.onboardingStates[index] = { ...store.onboardingStates[index], ...updates };
    return store.onboardingStates[index];
  }
  return null;
}

function setStepStatus(customerId, stepId, status) {
  const state = getOnboardingState(customerId);
  if (!state || !state.steps.some(s => s.id === stepId)) return null;
  const steps = state.steps.map(s => (s.id === stepId ? { ...s, status } : s));
  return updateOnboardingState(customerId, { steps, progressPercent: calculateProgress(steps) });
}

module.exports = {
  setStepStatus,
  getCustomers,
  getCustomerById,
  addCustomer,
  getTenants,
  getTenantByCustomerId,
  addTenant,
  getOnboardingState,
  getAllOnboardingStates,
  addOnboardingState,
  updateOnboardingState
};
