import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { resetPassword } from '../api';

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get email and otpToken from navigation state
  const email = location.state?.email;
  const otpToken = location.state?.otpToken;

  // Redirect if missing required data
  React.useEffect(() => {
    if (!email || !otpToken) {
      navigate('/forgot-password');
    }
  }, [email, otpToken, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, otpToken, formData.newPassword);
      // Success - redirect to login
      navigate('/login', {
        state: { message: 'Password reset successful! Please login with your new password.' }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p>Enter your new password</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              required
            />
            <div className="validation-rules">
              <strong>Password must contain:</strong>
              <ul>
                <li>At least 9 characters</li>
                <li>One lowercase letter</li>
                <li>One uppercase letter</li>
                <li>One special character (!@#$%^&*...)</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Reset Password'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
