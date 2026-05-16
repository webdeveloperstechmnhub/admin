import React, { useMemo, useState } from 'react';

import { Copy, Sparkles, KeyRound, ShieldCheck } from 'lucide-react';
import './AdminDashboard.css';
import GoBackButton from '../components/GoBackButton';

const instituteTypes = ['School', 'College', 'Coaching', 'Academy'];

const emptyForm = {
  instituteName: '',
  type: 'School',
  address: '',
  city: '',
  contactPerson: '',
  phone: '',
  email: '',
  password: '',
  autoGeneratePassword: true,
};

export default function CreateInstitute() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const token = useMemo(() => localStorage.getItem('adminToken') || '', []);

  const setField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const payload = {
        instituteName: form.instituteName,
        type: form.type,
        address: form.address,
        city: form.city,
        contactPerson: form.contactPerson,
        phone: form.phone,
        email: form.email,
        autoGeneratePassword: form.autoGeneratePassword,
        password: form.autoGeneratePassword ? '' : form.password,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/institutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.msg || 'Unable to create institute account.');
        return;
      }

      setSuccess(data);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
      setError('Unable to create institute account. Check API and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!success?.credentials) return;
    const text = `Email: ${success.credentials.email}\nPassword: ${success.credentials.password}`;
    await navigator.clipboard.writeText(text);
  };

  return (
    <main className="create-institute-page">
      <motion.div
        className="create-institute-bg-glow"
        animate={{ opacity: [0.45, 0.65, 0.45], scale: [1, 1.04, 1] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <section className="create-institute-wrap">
        <div className="create-institute-topbar">
          <div>
            <p className="create-institute-kicker">
              <Sparkles size={14} /> Admin Control
            </p>
            <h1>Create Institute Account</h1>
            <p>Only admins can provision verified institute logins.</p>
          </div>
          <GoBackButton to="/admin" label="Back to Dashboard" className="create-institute-back" />
        </div>

        <motion.form
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 130, damping: 18, mass: 0.8 }}
          onSubmit={handleSubmit}
          className="create-institute-card"
        >
          <motion.div
            className="card-shimmer"
            animate={{ x: ['-180%', '430%'] }}
            transition={{ duration: 3.1, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />

          <div className="create-grid">
            <label>
              Institute Name
              <input name="instituteName" value={form.instituteName} onChange={setField} required />
            </label>

            <label>
              Type
              <select name="type" value={form.type} onChange={setField} required>
                {instituteTypes.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="span-2">
              Address
              <input name="address" value={form.address} onChange={setField} required />
            </label>

            <label>
              City
              <input name="city" value={form.city} onChange={setField} required />
            </label>

            <label>
              Contact Person
              <input name="contactPerson" value={form.contactPerson} onChange={setField} required />
            </label>

            <label>
              Phone
              <input name="phone" value={form.phone} onChange={setField} required />
            </label>

            <label>
              Login Email
              <input type="email" name="email" value={form.email} onChange={setField} required />
            </label>

            <label className="toggle-row span-2">
              <input
                type="checkbox"
                name="autoGeneratePassword"
                checked={form.autoGeneratePassword}
                onChange={setField}
              />
              <span><KeyRound size={14} /> Auto-generate secure password</span>
            </label>

            {!form.autoGeneratePassword && (
              <label className="span-2">
                Manual Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={setField}
                  minLength={8}
                  required
                />
              </label>
            )}
          </div>

          {error ? <p className="create-institute-error">{error}</p> : null}

          {success ? (
            <div className="create-institute-success">
              <p><ShieldCheck size={15} /> {success.msg}</p>
              <div>
                <strong>Email:</strong> {success.credentials?.email}
              </div>
              <div>
                <strong>Password:</strong> {success.credentials?.password}
              </div>
              <button type="button" onClick={copyCredentials}>
                <Copy size={14} /> Copy Credentials
              </button>
            </div>
          ) : null}

          <button className="create-institute-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Institute Account'}
          </button>
        </motion.form>
      </section>
    </main>
  );
}
