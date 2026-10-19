import { useEffect, useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

type AccountType = 'personal' | 'fleet';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  acceptedTerms: boolean;
}

const initialForm: RegistrationForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '+234',
  username: '',
  password: '',
  confirmPassword: '',
  accountType: 'personal',
  acceptedTerms: false,
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const USERNAME_CHECK_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export default function CreateAccountPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');

  function updateField<Key extends keyof RegistrationForm>(
    key: Key,
    value: RegistrationForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'username') {
      setUsernameStatus('idle');
    }
  }

  useEffect(() => {
    const username = form.username.trim();
    if (!username || !USERNAME_CHECK_PATTERN.test(username)) {
      setUsernameStatus(username ? 'invalid' : 'idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = window.setTimeout(async () => {
      try {
        const result = await apiRequest<{ available: boolean }>(
          `/api/auth/username-available?username=${encodeURIComponent(username)}`,
        );
        setUsernameStatus(result.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [form.username]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!USERNAME_PATTERN.test(form.username)) {
      setError(
        'Username must be 3 to20 characters and use only letters, numbers, or underscores.',
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!form.acceptedTerms) {
      setError('You must accept the terms and privacy policy.');
      return;
    }

    setLoading(true);

    try {
      const result = await apiRequest<{ message: string }>(
        '/api/auth/register',
        undefined,
        {
          method: 'POST',
          body: JSON.stringify(form),
        },
      );
      setMessage(result.message);
      setForm(initialForm);
      setUsernameStatus('idle');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to create your account.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] px-4 py-8 text-[#18352f] sm:px-6 sm:py-10 md:px-8">
      <div className="auth-split-panel mx-auto grid max-w-5xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <aside className="auth-split-aside flex flex-col justify-between gap-8">
          <div>
            <Link to="/" className="text-sm text-[#b8e8d6] hover:text-white">
              ← Auto Chronicle
            </Link>
            <p className="mt-6 text-xs font-bold tracking-[0.25em] text-[#7ddfb8]">
              JOIN AUTO CHRONICLE
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#d4e8e2]">
              Track repairs, plan your car fund, and keep your vehicle history
              in one secure place.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-[#cce5dc]">
            <li className="flex gap-2">
              <span className="text-[#45d1a3]" aria-hidden>
                ✓
              </span>
              International phone & unique username
            </li>
            <li className="flex gap-2">
              <span className="text-[#45d1a3]" aria-hidden>
                ✓
              </span>
              Personal or fleet workspace
            </li>
            <li className="flex gap-2">
              <span className="text-[#45d1a3]" aria-hidden>
                ✓
              </span>
              Email verification before first sign-in
            </li>
          </ul>
        </aside>

        <section className="space-y-6 p-6 sm:p-8">
          <div className="lg:hidden">
            <Link to="/" className="auth-link text-sm">
              ← Auto Chronicle
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">First name</span>
              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField('firstName', event.target.value)
                }
                maxLength={50}
                required
                autoComplete="given-name"
                className="auth-input"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Last name</span>
              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField('lastName', event.target.value)
                }
                maxLength={50}
                required
                autoComplete="family-name"
                className="auth-input"
              />
            </label>

            <label className="space-y-2 text-sm sm:col-span-2">
              <span className="font-medium">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
                className="auth-input"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Phone</span>
              <input
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+2348000000000"
                required
                className="auth-input"
              />
              <span className="block text-xs text-[#71807c]">
                International format, e.g. +2348000000000
              </span>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Username</span>
              <input
                autoComplete="username"
                value={form.username}
                onChange={(event) =>
                  updateField('username', event.target.value.toLowerCase())
                }
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]{3,20}"
                required
                className="auth-input"
              />
              {usernameStatus === 'checking' && (
                <span className="text-xs text-[#71807c]">Checking…</span>
              )}
              {usernameStatus === 'available' && (
                <span className="text-xs text-[#36745e]">
                  Username is available
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="text-xs text-red-700">
                  Username is already taken
                </span>
              )}
              {usernameStatus === 'invalid' && form.username.trim() && (
                <span className="text-xs text-[#71807c]">
                  Use 3–20 characters: letters, numbers, underscores
                </span>
              )}
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  updateField('password', event.target.value)
                }
                minLength={8}
                maxLength={72}
                required
                className="auth-input"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField('confirmPassword', event.target.value)
                }
                minLength={8}
                maxLength={72}
                required
                className="auth-input"
              />
            </label>

            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="text-sm font-medium">Account type</legend>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['personal', 'Personal', 'One car, your story'],
                    ['fleet', 'Fleet', 'Teams & drivers'],
                  ] as const
                ).map(([value, title, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateField('accountType', value)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      form.accountType === value
                        ? 'border-[#36745e] bg-[#eaf3ed] ring-2 ring-[#36745e]/20'
                        : 'border-[#d8d9d2] bg-[#fbfaf6] hover:border-[#36745e]/50'
                    }`}
                  >
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-0.5 block text-xs text-[#71807c]">
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
              <input
                type="hidden"
                name="accountType"
                value={form.accountType}
              />
            </fieldset>

            <label className="flex items-start gap-3 text-sm text-[#71807c] sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.acceptedTerms}
                onChange={(event) =>
                  updateField('acceptedTerms', event.target.checked)
                }
                required
              />
              <span>
                I accept the{' '}
                <span className="text-[#36745e]">terms and privacy policy</span>
                .
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-700 sm:col-span-2">
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="rounded-lg border border-[#36745e]/30 bg-[#eaf3ed] p-3 text-sm text-[#153f36] sm:col-span-2"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || usernameStatus === 'taken'}
              className="auth-btn-primary sm:col-span-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#71807c] sm:text-left">
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
