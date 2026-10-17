import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  accountType: 'personal' | 'fleet';
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

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField<Key extends keyof RegistrationForm>(
    key: Key,
    value: RegistrationForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
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
    <main className="min-h-screen bg-[#fbfaf6] px-5 py-10 text-[#18352f]">
      <section className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border border-[#deded8] bg-white p-8 shadow-sm">
        <Link to="/" className="text-sm text-[#36745e] hover:underline">
          ← Auto Chronicle
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-[#71807c]">
            Use an international phone number and choose a unique username.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>First name</span>
            <input
              value={form.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              maxLength={50}
              required
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Last name</span>
            <input
              value={form.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              maxLength={50}
              required
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="space-y-2 text-sm sm:col-span-2">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Phone (international format)</span>
            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="+2348000000000"
              required
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Username</span>
            <input
              autoComplete="username"
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]{3,20}"
              required
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Confirm password</span>
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
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[#36745e]"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Account type</span>
            <select
              value={form.accountType}
              onChange={(event) =>
                updateField(
                  'accountType',
                  event.target.value as RegistrationForm['accountType'],
                )
              }
              className="w-full rounded-lg border border-[#d8d9d2] bg-[#fbfaf6] px-4 py-3"
            >
              <option value="personal">Personal</option>
              <option value="fleet">Fleet</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm text-[#71807c] sm:col-span-2">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(event) =>
                updateField('acceptedTerms', event.target.checked)
              }
              required
            />
            I accept the terms and privacy policy.
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-[#36745e] sm:col-span-2">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#36745e] px-4 py-3 font-semibold text-white disabled:opacity-60 sm:col-span-2"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-[#71807c]">
          Already registered?{' '}
          <Link to="/login" className="text-[#36745e] hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
