import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppPageLayout from '../components/AppPageLayout';
import { api } from '../services/api';

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  mileage_km: number | null;
  next_service: string | null;
  is_archived: boolean;
}

interface VehicleListResponse {
  data: Vehicle[];
  meta: {
    page: number;
    total: number;
    totalPages: number;
  };
}

function errorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error)) {
    return 'Unable to load your vehicles.';
  }
  const message = error.response?.data?.message;
  return Array.isArray(message)
    ? message.join(', ')
    : message || error.message || 'Unable to load your vehicles.';
}

function formatServiceDate(value: string | null): string {
  if (!value) return 'No service date set';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return `Service due ${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)}`;
}

export default function VehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [archived, setArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<VehicleListResponse>('/vehicles', {
        params: { page: 1, limit: 50, archived },
      });
      setVehicles(response.data.data);
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [archived]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const toggleArchived = async (vehicle: Vehicle) => {
    setError(null);
    try {
      await api.patch(
        `/vehicles/${vehicle.id}/${vehicle.is_archived ? 'unarchive' : 'archive'}`,
      );
      await loadVehicles();
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    }
  };

  return (
    <AppPageLayout>
      <div className="space-y-5 sm:space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
              Your garage
            </p>
            <h1 className="page-heading">Vehicles</h1>
            <p className="mt-2 text-sm text-gray-400">
              Keep vehicle details, repairs, and upcoming service in one place.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={archived}
              onChange={(event) => setArchived(event.target.checked)}
              className="h-4 w-4 accent-green-800"
            />
            Show archived
          </label>
        </header>

        {error && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-400" role="status">
            Loading vehicles...
          </p>
        ) : vehicles.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {vehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-xl">
                    🚘
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold">
                          {vehicle.name || `${vehicle.make} ${vehicle.model}`}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                      <span className="rounded-lg border border-gray-800 bg-gray-950 px-2.5 py-1 font-mono text-xs">
                        {vehicle.plate_number}
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-gray-500">
                      {vehicle.mileage_km === null
                        ? 'Mileage not set'
                        : `${new Intl.NumberFormat().format(vehicle.mileage_km)} km`}
                      <span className="mx-2 text-gray-300">·</span>
                      {formatServiceDate(vehicle.next_service)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/vehicles/${vehicle.id}/repairs/new`)
                        }
                        className="app-secondary-button"
                      >
                        Log repair
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/vehicles/${vehicle.id}/reports/new`)
                        }
                        className="app-secondary-button"
                      >
                        Report an issue
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleArchived(vehicle)}
                        className="app-text-button"
                      >
                        {vehicle.is_archived ? 'Restore vehicle' : 'Archive'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <section className="rounded-2xl border border-dashed border-gray-800 bg-gray-900 px-5 py-12 text-center">
            <span className="text-3xl" aria-hidden="true">
              🚘
            </span>
            <h2 className="mt-3 font-semibold">
              {archived ? 'No archived vehicles' : 'Your garage is ready'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {archived
                ? 'Vehicles you archive will appear here.'
                : 'There are no vehicles to show yet. Add one to start keeping its story.'}
            </p>
          </section>
        )}
      </div>
    </AppPageLayout>
  );
}
