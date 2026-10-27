const { describe, it } = require('node:test');
const assert = require('node:assert');
const store = require('./store');

describe('store', () => {
  it('seeds Acme plus the three sample-data customers', () => {
    const names = store.getAllOnboardingStates().map(s => store.getCustomerById(s.customerId).name);
    assert.deepStrictEqual(names, ['Acme Corporation', 'ABC Accounting', 'XYZ Financial Services', 'Premier Bookkeeping']);
  });

  it('setStepStatus updates the step and recalculates progress', () => {
    const state = store.setStepStatus('cust_002', 'step_1', 'completed');
    assert.strictEqual(state.steps.find(s => s.id === 'step_1').status, 'completed');
    assert.strictEqual(state.progressPercent, 25);
    assert.strictEqual(store.getOnboardingState('cust_002').progressPercent, 25);

    assert.strictEqual(store.setStepStatus('cust_002', 'step_1', 'pending').progressPercent, 0);
  });

  it('setStepStatus returns null for an unknown customer or step', () => {
    assert.strictEqual(store.setStepStatus('nope', 'step_1', 'completed'), null);
    assert.strictEqual(store.setStepStatus('cust_002', 'nope', 'completed'), null);
  });
});
