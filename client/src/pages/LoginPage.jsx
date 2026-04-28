import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

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

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="glass-panel w-full max-w-md space-y-5 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-soft/60">Welcome Back</p>
          <h1 className="mt-3 text-3xl font-semibold">Review code with AI and static analysis</h1>
        </div>

        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button className="w-full rounded-xl bg-accent px-5 py-3 font-medium text-slate-950">Login</button>

        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/github`}
          className="block rounded-xl border border-white/10 px-5 py-3 text-center text-soft transition hover:bg-white/5"
        >
          Continue with GitHub
        </a>

        <p className="text-sm text-soft">
          Need an account? <Link to="/register" className="text-accent">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
