import axios from 'axios';
import { useEffect, useState, type SubmitEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, getAccessToken, storeAuthSession } from '../services/api';

function errorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error)) {
    return 'Unable to accept this invitation.';
  }
  const message = error.response?.data?.message;
  return Array.isArray(message)
    ? message.join(', ')
    : message || error.message || 'Unable to accept this invitation.';
}

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token') ?? '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const callbackParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = callbackParams.get('access_token');
    const refreshToken = callbackParams.get('refresh_token');
    const authError =
      callbackParams.get('error_description') ?? callbackParams.get('error');

    if (authError) {
      setError(authError.replace(/\+/g, ' '));
      setSessionReady(true);
      return;
    }

    if (accessToken) {
      storeAuthSession({
        accessToken,
        refreshToken: refreshToken ?? undefined,
      });
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }

    setSessionReady(true);
  }, []);

  const handleAccept = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!invitationToken) {
      setError(
        'The invitation link is missing its token. Please open the email link again.',
      );
      return;
    }
    if (!sessionReady || !getAccessToken()) {
      setError(
        'Verify your invited email address by opening the invitation link from your email.',
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/fleet-invitations/accept', {
        firstName,
        lastName,
        password,
        confirmPassword,
        acceptedTerms,
        token: invitationToken,
      });
      navigate('/dashboard', { replace: true });
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell bg-[#f5f3eb] text-[#173c36]">
      <section className="auth-card max-w-lg">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#bd624c]">
            Fleet invitation
          </p>
          <h1 className="text-xl font-semibold sm:text-2xl">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-[#71807c]">
            Set up your profile to join the fleet. The invitation link verifies
            the email address you were invited with.
          </p>
        </div>

        {!sessionReady && (
          <p className="text-sm text-[#71807c]" role="status">
            Verifying your invitation link...
          </p>
        )}

        {sessionReady && !getAccessToken() && (
          <p className="text-sm text-[#9a5a36]" role="alert">
            Open the invitation link from your email to verify your account
            before continuing.
          </p>
        )}

        <form onSubmit={handleAccept} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-[#31584f]">
            <span className="block">First name</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={50}
              required
              className="auth-input"
            />
          </label>
          <label className="space-y-2 text-sm text-[#31584f]">
            <span className="block">Last name</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              maxLength={50}
              required
              className="auth-input"
            />
          </label>
          <label className="space-y-2 text-sm text-[#31584f] sm:col-span-2">
            <span className="block">Set password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
              className="auth-input"
            />
          </label>
          <label className="space-y-2 text-sm text-[#31584f] sm:col-span-2">
            <span className="block">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
              className="auth-input"
            />
          </label>
          <label className="flex items-start gap-3 text-sm text-[#71807c] sm:col-span-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              required
              className="mt-1 accent-[#36745e]"
            />
            <span>I accept the terms and privacy policy.</span>
          </label>
          {error && (
            <p className="text-sm text-red-700 sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !sessionReady}
            className="auth-btn-primary sm:col-span-2"
          >
            {submitting ? 'Joining fleet...' : 'Accept invitation'}
          </button>
        </form>

        <p className="text-center text-sm text-[#71807c]">
          Need to sign in instead?{' '}
          <Link to="/login" className="text-[#36745e] hover:underline">
            Go to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
