import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register(formData);
      navigate('/login', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <section className="auth-card">
        <p className="eyebrow">New patron</p>
        <h1>Create an account</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} required />
          </div>

          <div className="field-group">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="field-group">
            <label htmlFor="register-password">Password</label>
            <input id="register-password" name="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
