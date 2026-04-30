import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const to = location.state?.from?.pathname || '/';
      navigate(to, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-600 inline-flex items-center justify-center text-white font-bold text-xl mb-3">
            T
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1">Sign in to Team Task Manager</p>
        </div>
        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="text-sm text-center text-slate-500">
            No account?{' '}
            <Link to="/signup" className="text-brand-600 font-medium hover:underline">
              Create one
            </Link>
          </div>
        </form>
        <div className="mt-6 card p-4 text-xs text-slate-600 bg-slate-50">
          <div className="font-medium mb-2 text-slate-700">Demo accounts</div>
          <div className="space-y-1 font-mono">
            <div>admin@demo.com / admin123 <span className="text-slate-400">(admin)</span></div>
            <div>alice@demo.com / alice123 <span className="text-slate-400">(member)</span></div>
            <div>bob@demo.com / bob123 <span className="text-slate-400">(member)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
