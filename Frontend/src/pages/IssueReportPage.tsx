import axios from 'axios';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect, useState, type SubmitEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppPageLayout from '../components/AppPageLayout';
import { api } from '../services/api';

const categories = [
  ['warning_light', 'Warning light'],
  ['strange_sound', 'Strange sound'],
  ['car_feels_different', 'The car feels different'],
  ['leak_or_unusual_smell', 'Leak or unusual smell'],
  ['engine_or_starting_problem', 'Engine or starting problem'],
  ['brakes_or_braking', 'Brakes or braking'],
  ['steering_or_handling', 'Steering or handling'],
  ['tire_or_wheel_problem', 'Tyre or wheel problem'],
  ['battery_or_electrical_issue', 'Battery or electrical issue'],
  ['heating_or_air_conditioning', 'Heating or air conditioning'],
  ['bodywork_or_windscreen', 'Bodywork or windscreen'],
  ['something_else', 'Something else'],
] as const;

const severityOptions = [
  ['can_still_drive', 'I can still drive'],
  ['drive_with_care', 'I can drive with care'],
  ['cannot_be_driven', 'I cannot drive it'],
  ['not_sure', 'I’m not sure'],
] as const;

const timingOptions = [
  ['intermittent', 'It comes and goes'],
  ['constant', 'It happens all the time'],
  ['when_starting', 'When starting'],
  ['while_driving', 'While driving'],
  ['when_braking', 'When braking'],
] as const;

interface VehicleOption {
  id: string;
  name: string | null;
  make: string;
  model: string;
  year: number;
}

interface VehicleListResponse {
  data: VehicleOption[];
}

function messageFor(error: unknown): string {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error)) {
    return 'Unable to send your report. Please try again.';
  }
  const message = error.response?.data?.message;
  return Array.isArray(message)
    ? message.join(', ')
    : message || error.message || 'Unable to send your report.';
}

export default function IssueReportPage() {
  const navigate = useNavigate();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId ?? '');
  const [loadingVehicles, setLoadingVehicles] = useState(!vehicleId);
  const [category, setCategory] = useState('strange_sound');
  const [severity, setSeverity] = useState('can_still_drive');
  const [timing, setTiming] = useState('intermittent');
  const [description, setDescription] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicleId) {
      setSelectedVehicleId(vehicleId);
      return;
    }

    let cancelled = false;
    api
      .get<VehicleListResponse>('/vehicles', {
        params: { page: 1, limit: 100, archived: false },
      })
      .then((response) => {
        if (!cancelled) setVehicles(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(messageFor(requestError));
      })
      .finally(() => {
        if (!cancelled) setLoadingVehicles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVehicleId) {
      setError('Choose a vehicle before sending a report.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/vehicles/${selectedVehicleId}/driver-reports`, {
        category,
        severity,
        timing,
        description: description.trim() || undefined,
        odometerReading: odometerReading ? Number(odometerReading) : undefined,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      });
      navigate('/reports', {
        replace: true,
        state: { notice: 'Your issue report was sent to the fleet owner.' },
      });
    } catch (requestError: unknown) {
      setError(messageFor(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppPageLayout>
      <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
        <Link
          to={vehicleId ? '/vehicles' : '/dashboard'}
          className="inline-flex items-center gap-2 text-sm font-medium text-green-800 hover:text-green-950"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {vehicleId ? 'Back to vehicles' : 'Back to dashboard'}
        </Link>

        <header>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
            Auto Chronicle
          </p>
          <h1 className="page-heading">Something’s wrong?</h1>
          <p className="mt-2 text-sm text-gray-500">
            Pick the closest match. You don’t need to diagnose it.
          </p>
        </header>

        <div className="issue-notice flex gap-3 rounded-2xl p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/60 text-lg">
            !
          </span>
          <div>
            <p className="font-semibold">Report a car issue</p>
            <p className="mt-1 text-xs leading-relaxed">
              Choose from the dropdowns below. We’ll add it to your car’s story.
            </p>
          </div>
        </div>

        {error && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!vehicleId && (
            <label className="block space-y-2 text-sm font-semibold">
              <span>Which vehicle is affected?</span>
              {loadingVehicles ? (
                <span className="block text-sm font-normal text-gray-500">
                  Loading your vehicles...
                </span>
              ) : vehicles.length ? (
                <select
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  className="app-input"
                  required
                >
                  <option value="">Choose a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name ||
                        `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="block font-normal text-gray-500">
                  No active vehicles found. Add a vehicle before reporting an
                  issue.
                </span>
              )}
            </label>
          )}

          <label className="block space-y-2 text-sm font-semibold">
            <span>What did you notice?</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="app-input"
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm font-semibold">
              <span>How serious is it?</span>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                className="app-input"
              >
                {severityOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-semibold">
              <span>When does it happen?</span>
              <select
                value={timing}
                onChange={(event) => setTiming(event.target.value)}
                className="app-input"
              >
                {timingOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold">
            <span>
              Anything else?{' '}
              <span className="font-normal text-gray-500">Optional</span>
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Add a little detail to help us understand..."
              className="app-input resize-y"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold">
            <span>
              Current odometer{' '}
              <span className="font-normal text-gray-500">Optional</span>
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={odometerReading}
              onChange={(event) => setOdometerReading(event.target.value)}
              placeholder="e.g. 72450"
              className="app-input"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold">
            <span>
              When did you notice it?{' '}
              <span className="font-normal text-gray-500">Optional</span>
            </span>
            <input
              type="datetime-local"
              max={new Date().toISOString().slice(0, 16)}
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              className="app-input"
            />
          </label>

          <p className="text-center text-xs text-gray-500">
            <Check aria-hidden="true" className="mr-1 inline h-4 w-4" />
            We’ll save this to your car’s story.
          </p>
          <button
            type="submit"
            disabled={submitting || !selectedVehicleId || loadingVehicles}
            className="app-primary-button w-full"
          >
            {submitting ? 'Sending report...' : 'Save update'}
            {!submitting && (
              <ArrowRight aria-hidden="true" className="ml-1 inline h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </AppPageLayout>
  );
}
