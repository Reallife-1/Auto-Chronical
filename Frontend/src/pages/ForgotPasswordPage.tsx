import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await apiRequest<{ message: string }>(
        '/api/auth/forgot-password',
        undefined,
        {
          method: 'POST',
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
      );
      setMessage(result.message);
      setEmail('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to send reset email.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell bg-[#fbfaf6] text-[#18352f]">
      <section className="auth-card max-w-md">
        <Link to="/login" className="auth-link text-sm">
          ← Back to sign in
        </Link>
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Forgot password
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#71807c]">
            Enter the email on your account. If it exists, we&apos;ll send a
            link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="auth-input"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="rounded-lg border border-[#36745e]/30 bg-[#eaf3ed] p-3 text-sm text-[#153f36]"
            >
              {message}
            </p>
          )}

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-sm text-[#71807c]">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
