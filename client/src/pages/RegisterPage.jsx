import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'developer' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/auth/register', form);
      saveAuth(response.data);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="glass-panel w-full max-w-md space-y-5 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-soft/60">Create Account</p>
          <h1 className="mt-3 text-3xl font-semibold">Spin up your secure review workspace</h1>
        </div>

        <input
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
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
        <select
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
          value={form.role}
          onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
        >
          <option value="developer">Developer</option>
          <option value="admin">Admin</option>
        </select>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button className="w-full rounded-xl bg-accent px-5 py-3 font-medium text-slate-950">Register</button>

        <p className="text-sm text-soft">
          Already registered? <Link to="/login" className="text-accent">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
