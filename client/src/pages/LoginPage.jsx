import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/auth/login', form);
      saveAuth(response.data);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed');
    }
  };

  // ✅ Google Success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', {
        token: credentialResponse.credential,
      });

      saveAuth(res.data);
      navigate('/');
    } catch (err) {
      console.log(err);
      setError('Google login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="glass-panel w-full max-w-md space-y-5 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-soft/60">Welcome Back</p>
          <h1 className="mt-3 text-3xl font-semibold">
            Review code with AI and static analysis
          </h1>
        </div>

        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <button className="w-full rounded-xl bg-accent px-5 py-3 font-medium text-slate-950">
          Login
        </button>

        {/* ✅ Google Login Button */}
       <div className="w-full">
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={() => setError('Google Login Failed')}
    width="100%"   // ✅ makes it full width
  />
</div>

        <p className="text-sm text-soft text-center">
          Need an account? <Link to="/register" className="text-accent">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;