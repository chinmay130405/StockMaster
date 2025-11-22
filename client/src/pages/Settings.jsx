import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../api';

function Settings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setMessage('Profile settings will be updated');
    setError('');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setMessage('Password change functionality will be implemented');
    setError('');
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <>
      <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
        Settings
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
        Manage your account settings and preferences
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        {/* Settings Navigation */}
        <div className="settings-nav">
          <div className="info-card" style={{ padding: '1rem' }}>
            <button
              onClick={() => setActiveSection('profile')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: activeSection === 'profile' ? '#eff6ff' : 'transparent',
                color: activeSection === 'profile' ? '#1e40af' : '#64748b',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: activeSection === 'profile' ? '600' : '500',
                fontSize: '14px',
                marginBottom: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              👤 Profile
            </button>
            <button
              onClick={() => setActiveSection('security')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: activeSection === 'security' ? '#eff6ff' : 'transparent',
                color: activeSection === 'security' ? '#1e40af' : '#64748b',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: activeSection === 'security' ? '600' : '500',
                fontSize: '14px',
                marginBottom: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              🔒 Security
            </button>
            <button
              onClick={() => setActiveSection('preferences')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: activeSection === 'preferences' ? '#eff6ff' : 'transparent',
                color: activeSection === 'preferences' ? '#1e40af' : '#64748b',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: activeSection === 'preferences' ? '600' : '500',
                fontSize: '14px',
                marginBottom: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              ⚙️ Preferences
            </button>
            <button
              onClick={() => setActiveSection('about')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: activeSection === 'about' ? '#eff6ff' : 'transparent',
                color: activeSection === 'about' ? '#1e40af' : '#64748b',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: activeSection === 'about' ? '600' : '500',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              ℹ️ About
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {message && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{message}</div>}
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="info-card">
              <h3 className="info-title">Profile Settings</h3>
              <form onSubmit={handleProfileUpdate} style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                  <div className="helper-text">Used for notifications and account recovery</div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Update Profile
                </button>
              </form>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="info-card">
              <h3 className="info-title">Security Settings</h3>
              <form onSubmit={handlePasswordChange} style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>

                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ background: '#fef2f2', color: '#dc2626' }}
                  >
                    🚪 Logout from Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Preferences Section */}
          {activeSection === 'preferences' && (
            <div className="info-card">
              <h3 className="info-title">Application Preferences</h3>
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '15px', color: '#1e293b' }}>Enable email notifications</span>
                  </label>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '15px', color: '#1e293b' }}>Show low stock alerts</span>
                  </label>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '15px', color: '#1e293b' }}>Enable operation reminders</span>
                  </label>
                </div>

                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* About Section */}
          {activeSection === 'about' && (
            <div className="info-card">
              <h3 className="info-title">About StockMaster</h3>
              <div style={{ marginTop: '1.5rem', color: '#64748b', lineHeight: '1.8' }}>
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Build:</strong> 2025.11.22</p>
                <p style={{ marginTop: '1rem' }}>
                  StockMaster is a comprehensive inventory management system designed to streamline 
                  warehouse operations, track stock movements, and manage receipts and deliveries efficiently.
                </p>
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                  <p><strong>Support:</strong> support@stockmaster.com</p>
                  <p><strong>Documentation:</strong> <a href="#" style={{ color: '#3b82f6' }}>View Docs</a></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Settings;
