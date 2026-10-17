import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, storeAuthSession } from '../services/api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await apiRequest<LoginResponse>(
        '/api/auth/login',
        undefined,
        {
          method: 'POST',
          body: JSON.stringify({ identifier, password }),
        },
      );

      storeAuthSession(session);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to sign in.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf6] px-5 py-10 text-[#18352f]">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-[#deded8] bg-white p-8 text-[#18352f] shadow-sm">
        <Link to="/" className="text-sm text-[#36745e] hover:underline">
          ← Auto Chronicle
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-[#71807c]">
            Sign in with your email, username, or phone number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span>Email, username, or phone</span>
            <input
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#36745e] px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-[#71807c]">
          New to Auto Chronicle?{' '}
          <Link to="/register" className="text-[#36745e] hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
