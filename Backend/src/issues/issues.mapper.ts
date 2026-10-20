import { IssueStatus } from './issues.constants';

export type IssueRow = {
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
  status: IssueStatus;
  source_driver_report_id: string | null;
  reported_at: string;
  created_at: string;
  updated_at: string;
};

export type IssueHistoryRow = {
  id: string;
  changed_by: string | null;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_at: string;
};

export function toIssueResponse(row: IssueRow) {
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
    sourceDriverReportId: row.source_driver_report_id,
    reportedAt: row.reported_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toHistoryResponse(row: IssueHistoryRow) {
  return {
    id: row.id,
    changedBy: row.changed_by,
    oldStatus: row.old_status,
    newStatus: row.new_status,
    note: row.note,
    changedAt: row.changed_at,
  };
}
