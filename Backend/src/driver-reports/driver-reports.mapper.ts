import type { DriverReportStatus } from './dto/list-driver-reports-query.dto';

export type DriverReportRow = {
  id: string;
  vehicle_id: string;
  fleet_id: string | null;
  reported_by: string;
  category: string;
  severity: string;
  timing: string;
  description: string | null;
  odometer_reading: number | null;
  occurred_at: string | null;
  status: DriverReportStatus;
  logged_by: string | null;
  logged_at: string | null;
  dismissed_by: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function toDriverReportResponse(row: DriverReportRow) {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    fleetId: row.fleet_id,
    reportedBy: row.reported_by,
    category: row.category,
    severity: row.severity,
    timing: row.timing,
    description: row.description,
    odometerReading: row.odometer_reading,
    occurredAt: row.occurred_at,
    status: row.status,
    loggedBy: row.logged_by,
    loggedAt: row.logged_at,
    dismissedBy: row.dismissed_by,
    dismissedAt: row.dismissed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
