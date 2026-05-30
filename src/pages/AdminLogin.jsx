import React, { useState } from 'react';
import './AdminDashboard.css';

export default function AdminLogin({ onLogin }) {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId, password, operatorName })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        onLogin(true);
      } else {
        alert(data.msg || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="brand-badge">TechMNHub</div>
          <h2>Admin Portal</h2>
          <p>Sign in with your Employee ID to manage TechMNHub</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Employee ID</label>
            <input
              type="text"
              placeholder="EMP-001"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Operator Name</label>
            <input
              type="text"
              placeholder="Your Name (e.g. John Doe)"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-creds">
          <p>Use the Employee ID and password issued from employee provisioning.</p>
        </div>
      </div>
    </div>
  );
}