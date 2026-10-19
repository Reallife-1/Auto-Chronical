import { useEffect, useState, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';

function readRecoveryToken(): string | null {
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const fromHash = hashParams.get('access_token');
  if (fromHash) return fromHash;

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('access_token');
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const authError =
      hashParams.get('error_description') ?? hashParams.get('error');

    if (authError) {
      setTokenError(authError.replace(/\+/g, ' '));
      return;
    }

    const token = readRecoveryToken();
    if (!token) {
      setTokenError(
        'This reset link is invalid or has expired. Request a new one from the sign-in page.',
      );
      return;
    }

    setRecoveryToken(token);
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  }, []);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!recoveryToken) {
      setError('Missing recovery token. Please use the link from your email.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8 || password.length > 20) {
      setError('Password must be between 8 and 20 characters.');
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest<{ message: string }>(
        '/api/auth/reset-password',
        recoveryToken,
        {
          method: 'POST',
          body: JSON.stringify({ password, confirmPassword }),
        },
      );
      setMessage(result.message);
      window.setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to reset password.',
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
            Set new password
          </h1>
          <p className="mt-2 text-sm text-[#71807c]">
            Choose a strong password for your Auto Chronicle account.
          </p>
        </div>

        {tokenError ? (
          <>
            <p role="alert" className="text-sm text-red-700">
              {tokenError}
            </p>
            <Link to="/forgot-password" className="auth-link text-sm">
              Request a new reset link
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={20}
                required
                className="auth-input"
              />
              <span className="block text-xs text-[#71807c]">
                8–20 characters (required for password reset)
              </span>
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium">Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={20}
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
                {message} Redirecting to sign in…
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !recoveryToken}
              className="auth-btn-primary"
            >
              {loading ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
