import React, { useState, useEffect } from 'react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'customer-info', label: 'Customer Info' },
  { id: 'data-mapping', label: 'Data Mapping' },
  { id: 'tenant-setup', label: 'Tenant Setup' },
  { id: 'import', label: 'Import' }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [onboardingData, setOnboardingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/onboarding')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid response format');
        return data;
      })
      .then(data => {
        setOnboardingData(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch onboarding data:', err);
        setError(err.message);
        setOnboardingData([]);
        setLoading(false);
      });
  }, []);

  const toggleStep = (customerId, step) => {
    const status = step.status === 'completed' ? 'pending' : 'completed';
    fetch(`/api/customers/${customerId}/onboarding/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(updated => {
        setOnboardingData(items => items.map(item => (item.customerId === customerId ? { ...item, ...updated } : item)));
      })
      .catch(err => alert(`Could not update step: ${err.message}`));
  };

  return (
    <div className="app">
      <header>
        <h1>Onboarding Dashboard</h1>
        <p>Customer Success Team - Internal Tool</p>
      </header>

      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && (
          <DashboardTab data={onboardingData} loading={loading} error={error} onToggleStep={toggleStep} />
        )}
        {activeTab === 'customer-info' && (
          <CustomerInfoTab
            onAdded={item => {
              setOnboardingData(items => [...items, item]);
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'data-mapping' && (
          <DataMapping
            onSaved={updated => {
              setOnboardingData(items => items.map(item => (item.customerId === updated.customerId ? { ...item, ...updated } : item)));
            }}
          />
        )}
        {activeTab === 'tenant-setup' && (
          <PlaceholderTab title="Tenant Setup" description="Provision and configure customer tenant" />
        )}
        {activeTab === 'import' && (
          <PlaceholderTab title="Import" description="Import customer data into the platform" />
        )}
      </main>
    </div>
  );
}

function DashboardTab({ data, loading, error, onToggleStep }) {
  if (loading) {
    return <div className="placeholder"><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="placeholder">
        <p style={{ color: '#dc2626' }}>⚠️ Failed to load onboarding data</p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="placeholder"><p>No customers in the onboarding queue</p></div>;
  }

  return (
    <div>
      <h2>Onboarding Queue</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        {data.length} customer(s) awaiting onboarding
      </p>

      {data.map(item => (
        <div key={item.customerId} className="customer-card">
          <h3>{item.customerName}</h3>
          <div className="customer-meta">
            <span>📍 {item.customerRegion}</span>
            <span>🏭 {item.customerIndustry}</span>
          </div>

          <div className="progress-section">
            <ProgressBar percent={item.progressPercent} />
            <Checklist steps={item.steps} onToggle={step => onToggleStep(item.customerId, step)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar" 
        style={{ width: `${Math.max(percent, 0)}%` }}
      >
        {percent > 0 ? `${percent}%` : ''}
      </div>
    </div>
  );
}

function Checklist({ steps, onToggle }) {
  return (
    <ul className="checklist">
      {steps.map(step => (
        <li
          key={step.id}
          role="checkbox"
          aria-checked={step.status === 'completed'}
          aria-disabled={step.automatic || undefined}
          aria-label={step.name}
          tabIndex={step.automatic ? -1 : 0}
          style={{ cursor: step.automatic ? 'default' : 'pointer' }}
          title={
            step.automatic
              ? 'Completed automatically when name, location and type are filled in'
              : step.status === 'completed' ? 'Click to mark as pending' : 'Click to mark as done'
          }
          onClick={() => !step.automatic && onToggle(step)}
          onKeyDown={e => !step.automatic && (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onToggle(step))}
        >
          <span className={`step-status ${step.status}`}>
            {step.status === 'completed' ? '✓' : step.order}
          </span>
          <span>{step.name}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#9ca3af' }}>
            {step.status.replace('_', ' ')}{step.automatic ? ' · auto' : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CustomerInfoTab({ onAdded }) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [industry, setIndustry] = useState('');
  const [errors, setErrors] = useState({});

  const submit = e => {
    e.preventDefault();
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, region, industry })
    })
      .then(async res => {
        const body = await res.json();
        if (res.status === 400) return setErrors(body.errors || {});
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        onAdded(body);
      })
      .catch(err => setErrors({ form: err.message }));
  };

  const fieldStyle = { display: 'block', margin: '6px 0 2px', padding: '8px', width: '320px' };
  const errorStyle = { color: '#dc2626', fontSize: '0.85rem' };

  return (
    <form onSubmit={submit} noValidate>
      <h2>Customer Info</h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>Add a new customer to the onboarding queue</p>
      <label>
        Company name
        <input style={fieldStyle} value={name} onChange={e => setName(e.target.value)} />
      </label>
      {errors.name && <p style={errorStyle}>{errors.name}</p>}
      <label>
        Location
        <input style={fieldStyle} list="region-options" value={region} onChange={e => setRegion(e.target.value)} />
      </label>
      <datalist id="region-options">
        <option value="North America" />
        <option value="United Kingdom" />
        <option value="Europe" />
        <option value="Asia Pacific" />
      </datalist>
      {errors.region && <p style={errorStyle}>{errors.region}</p>}
      <label>
        Type
        <input style={fieldStyle} list="industry-options" value={industry} onChange={e => setIndustry(e.target.value)} />
      </label>
      <datalist id="industry-options">
        <option value="Accounting" />
        <option value="Bookkeeping" />
        <option value="Financial Services" />
        <option value="Manufacturing" />
      </datalist>
      {errors.industry && <p style={errorStyle}>{errors.industry}</p>}
      {errors.form && <p style={errorStyle}>Could not add customer: {errors.form}</p>}
      <button type="submit" className="tab active" style={{ marginTop: '12px' }}>Add to queue</button>
    </form>
  );
}

const SAMPLE_SOURCES = [
  { key: 'CustomerA_ABCAccounting', label: 'A — ABC Accounting', customerId: 'cust_002' },
  { key: 'CustomerB_XYZFinancialServices', label: 'B — XYZ Financial Services', customerId: 'cust_003' },
  { key: 'CustomerC_PremierBookkeeping', label: 'C — Premier Bookkeeping', customerId: 'cust_004' }
];

const SAMPLE_FILES = ['clients', 'contacts', 'chart_of_accounts', 'transactions'];

const CLIENT_TARGET_FIELDS = ['id', 'name', 'entityType', 'status', 'startDate', 'taxId', 'revenue', 'industry', 'paymentTerms'];

function DataMapping({ onSaved }) {
  const [sourceKey, setSourceKey] = useState(SAMPLE_SOURCES[0].key);
  const [file, setFile] = useState('clients');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState({});
  const [autoCount, setAutoCount] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  const source = SAMPLE_SOURCES.find(s => s.key === sourceKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    fetch(`/api/sample-files/${sourceKey}/${file}`)
      .then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        return body;
      })
      .then(async data => {
        if (cancelled) return;
        setFields({});
        setAutoCount(null);
        setPreview(data);
        setLoading(false);
        if (file !== 'clients') return;
        const res = await fetch('/api/mapping/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: 'clients', columns: data.columns })
        });
        if (!res.ok || cancelled) return;
        const { fields: suggested } = await res.json();
        setFields(suggested);
        setAutoCount(Object.values(suggested).filter(Boolean).length);
      })
      .catch(err => {
        if (cancelled) return;
        setPreview(null);
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceKey, file]);

  const save = () => {
    setSaveMessage(null);
    fetch(`/api/customers/${source.customerId}/mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceCustomer: sourceKey, entity: 'clients', fields })
    })
      .then(async res => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        setSaveMessage({ ok: true, text: 'Mapping saved — Data Mapping step complete' });
        onSaved(body.onboarding);
      })
      .catch(err => setSaveMessage({ ok: false, text: `Could not save mapping: ${err.message}` }));
  };

  const sampleRow = preview?.rows[0] || [];

  return (
    <div>
      <h2>Data Mapping</h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>Preview customer data and map it to the platform schema</p>

      <div className="mapping-controls">
        <label>
          Customer
          <select value={sourceKey} onChange={e => setSourceKey(e.target.value)}>
            {SAMPLE_SOURCES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>
          File
          <select value={file} onChange={e => setFile(e.target.value)}>
            {SAMPLE_FILES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#dc2626' }}>Failed to load file: {error}</p>}

      {preview && !loading && (
        <div className="table-scroll">
          <table className="csv-preview">
            <thead>
              <tr>{preview.columns.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview && !loading && file === 'clients' && (
        <div style={{ marginTop: '24px' }}>
          <h3>Field mapping</h3>
          {autoCount !== null && (
            <p className="auto-map-note">
              Auto-mapped {autoCount} of {CLIENT_TARGET_FIELDS.length} fields — review, then save
            </p>
          )}
          <table className="field-mapping">
            <thead>
              <tr><th>Platform field</th><th>Source column</th><th>Sample value</th></tr>
            </thead>
            <tbody>
              {CLIENT_TARGET_FIELDS.map(field => {
                const column = fields[field] || '';
                const index = preview.columns.indexOf(column);
                return (
                  <tr key={field}>
                    <td>{field}</td>
                    <td>
                      <select aria-label={field} value={column} onChange={e => setFields(f => ({ ...f, [field]: e.target.value }))}>
                        <option value="">— not mapped —</option>
                        {preview.columns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="sample-value">{index >= 0 ? sampleRow[index] : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" className="tab active" style={{ marginTop: '12px' }} onClick={save}>Save Mapping</button>
          {saveMessage && (
            <p style={{ marginTop: '8px', color: saveMessage.ok ? '#16a34a' : '#dc2626' }}>{saveMessage.text}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ title, description }) {
  return (
    <div className="placeholder">
      <h2>{title}</h2>
      <p>{description}</p>
      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        🚧 This section is ready to be built
      </p>
    </div>
  );
}

export default App;
