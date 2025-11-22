import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { verifyOTP } from '../api';

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      const response = await verifyOTP(formData.email, formData.otp);
      // Navigate to reset password page with token
      navigate('/reset-password', {
        state: {
          email: formData.email,
          otpToken: response.otpToken
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Verify OTP</h1>
        <p>Enter the 6-digit code sent to your email</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="alert alert-info">
          💡 Check your console if SMTP is not configured (development mode)
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              pattern="\d{6}"
              required
            />
            <div className="helper-text">OTP expires in 10 minutes</div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Verify OTP'}
          </button>
        </form>

        <div className="auth-links">
          Didn't receive OTP? <Link to="/forgot-password">Resend OTP</Link>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;
