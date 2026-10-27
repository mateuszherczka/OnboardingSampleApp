const { describe, it } = require('node:test');
const assert = require('node:assert');
const store = require('./store');

describe('store', () => {
  it('seeds Acme plus the three sample-data customers', () => {
    const names = store.getAllOnboardingStates().map(s => store.getCustomerById(s.customerId).name);
    assert.deepStrictEqual(names, ['Acme Corporation', 'ABC Accounting', 'XYZ Financial Services', 'Premier Bookkeeping']);
  });

  it('seeded customers have complete info, so Customer Info is done automatically', () => {
    for (const state of store.getAllOnboardingStates()) {
      assert.strictEqual(state.steps.find(s => s.id === 'step_1').status, 'completed', state.customerId);
      assert.strictEqual(state.progressPercent, 25, state.customerId);
    }
  });

  it('onboardCustomer leaves Customer Info pending when info is incomplete', () => {
    const customer = store.onboardCustomer({ name: 'Half Co' });
    assert.strictEqual(store.getOnboardingState(customer.id).steps.find(s => s.id === 'step_1').status, 'pending');
  });

  it('setStepStatus updates the step and recalculates progress', () => {
    const state = store.setStepStatus('cust_002', 'step_2', 'completed');
    assert.strictEqual(state.steps.find(s => s.id === 'step_2').status, 'completed');
    assert.strictEqual(state.progressPercent, 50);
    assert.strictEqual(store.getOnboardingState('cust_002').progressPercent, 50);

    assert.strictEqual(store.setStepStatus('cust_002', 'step_2', 'pending').progressPercent, 25);
  });

  it('onboardCustomer adds a customer to the queue with Customer Info done', () => {
    const customer = store.onboardCustomer({ name: 'New Co', region: 'Europe', industry: 'Accounting' });
    const state = store.getOnboardingState(customer.id);
    assert.strictEqual(state.steps.find(s => s.id === 'step_1').status, 'completed');
    assert.strictEqual(state.progressPercent, 25);
    assert.strictEqual(store.getTenantByCustomerId(customer.id).status, 'pending');
  });

  it('validateCustomerInput requires name, location and type, and normalizes input', () => {
    const { validateCustomerInput } = require('../models');
    assert.deepStrictEqual(Object.keys(validateCustomerInput({}).errors), ['name', 'region', 'industry']);
    const { value, errors } = validateCustomerInput({ name: '  New   Co ', region: ' Europe', industry: 'Accounting', contactEmail: ' A@B.example.com ' });
    assert.deepStrictEqual(errors, {});
    assert.strictEqual(value.name, 'New Co');
    assert.strictEqual(value.contactEmail, 'a@b.example.com');
    assert.ok(validateCustomerInput({ name: 'x', region: 'y', industry: 'z', contactEmail: 'bad' }).errors.contactEmail);
  });

  it('saveMapping stores the mapping, replaces earlier ones and completes Data Mapping', () => {
    store.saveMapping('cust_003', { entity: 'clients', fields: { id: 'old' } });
    const { mapping, onboarding } = store.saveMapping('cust_003', { entity: 'clients', fields: { id: 'clientCode' } });
    assert.strictEqual(mapping.fields.id, 'clientCode');
    assert.strictEqual(store.getMapping('cust_003').fields.id, 'clientCode');
    assert.strictEqual(onboarding.steps.find(s => s.id === 'step_2').status, 'completed');
    assert.strictEqual(onboarding.progressPercent, 50);
    assert.strictEqual(store.getMapping('cust_004'), undefined);
  });

  it('setStepStatus returns null for an unknown customer or step', () => {
    assert.strictEqual(store.setStepStatus('nope', 'step_1', 'completed'), null);
    assert.strictEqual(store.setStepStatus('cust_002', 'nope', 'completed'), null);
  });
});
