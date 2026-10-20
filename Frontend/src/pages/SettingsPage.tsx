import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleUserRound,
  LockKeyhole,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';

import AppPageLayout from '../components/AppPageLayout';

export default function SettingsPage() {
  return (
    <AppPageLayout>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#deded5] text-[#17453d] transition hover:bg-white"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#36745e]">
              AUTO CHRONICLE
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-[#173c36] sm:text-3xl">
              Settings
            </h1>

            <p className="mt-1 text-sm text-[#74847e]">
              Manage your account and preferences.
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#36745e]">
            Account
          </h2>

          <div className="divide-y divide-[#deded5] overflow-hidden rounded-2xl border border-[#deded5] bg-white">
            <SettingsLink
              to="/profile"
              icon={<CircleUserRound size={21} />}
              title="Profile"
              description="Manage your personal information."
            />

            <SettingsLink
              to="/forgot-password"
              icon={<LockKeyhole size={21} />}
              title="Password and security"
              description="Reset your password and manage sign-in protection."
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#36745e]">
            Preferences
          </h2>

          <div className="divide-y divide-[#deded5] overflow-hidden rounded-2xl border border-[#deded5] bg-white">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f3eb] text-[#17453d]">
                <Bell size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-[#173c36]">
                  Notifications
                </h3>

                <p className="mt-1 text-sm text-[#74847e]">
                  View vehicle and maintenance reminders from your Dashboard.
                </p>

                <Link
                  to="/dashboard"
                  className="mt-2 inline-block text-sm font-semibold text-[#36745e] hover:underline"
                >
                  View notifications
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f3eb] text-[#17453d]">
                <SlidersHorizontal size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-[#173c36]">
                  Application preferences
                </h3>

                <p className="mt-1 text-sm text-[#74847e]">
                  Additional preferences can be added when their settings
                  are supported by the backend.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#deded5] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f3eb] text-[#17453d]">
              <LogOut size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-[#173c36]">
                Signing out
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#74847e]">
                To end your session, use the Sign Out option in your
                account menu or the Profile page.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppPageLayout>
  );
}

interface SettingsLinkProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function SettingsLink({
  to,
  icon,
  title,
  description,
}: SettingsLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-5 transition hover:bg-[#fbfaf6]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f3eb] text-[#17453d]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-[#173c36]">
          {title}
        </h3>

        <p className="mt-1 text-sm text-[#74847e]">
          {description}
        </p>
      </div>

      <ChevronRight
        size={20}
        className="shrink-0 text-[#74847e]"
      />
    </Link>
  );
}
