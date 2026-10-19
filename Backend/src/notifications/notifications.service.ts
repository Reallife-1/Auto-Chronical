import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
export type NotificationPriority = 'urgent' | 'high' | 'normal';
export type NotificationType =
  | 'service_due'
  | 'insurance_expiry'
  | 'car_fund_contribution'
  | 'car_fund_goal';
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  dueDate: string;
  actionUrl: string;
  entityId: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
interface NotificationVehicle {
  id: string;
  name: string | null;
  make: string;
  model: string;
  next_service: string | null;
  insurance_expiry: string | null;
}
interface NotificationFund {
  id: string;
  target_amount: number | string;
  currency: string;
  target_date: string | null;
  planned_contribution_amount: number | string | null;
  contribution_cadence: string | null;
  next_reminder_date: string | null;
  reminders_enabled: boolean;
}
interface NotificationDatabaseRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  due_date: string;
  action_url: string;
  entity_id: string;
  dedupe_key: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}
interface NotificationDraft {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  dueDate: string;
  actionUrl: string;
  entityId: string;
  dedupeKey: string;
}
const SERVICE_NOTICE_DAYS = 7;
const INSURANCE_NOTICE_DAYS = 30;
const FUND_GOAL_NOTICE_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function vehicleName(vehicle: NotificationVehicle): string {
  return (
    vehicle.name?.trim() ||
    `${vehicle.make} ${vehicle.model}`.trim() ||
    'Vehicle'
  );
}
function daysUntil(date: string, today: string): number {
  return Math.floor(
    (new Date(`${date}T00:00:00.000Z`).getTime() -
      new Date(`${today}T00:00:00.000Z`).getTime()) /
      86_400_000,
  );
}
function mapDatabaseNotification(
  row: NotificationDatabaseRow,
): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    priority: row.priority,
    dueDate: row.due_date,
    actionUrl: row.action_url,
    entityId: row.entity_id,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}
@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string, query: ListNotificationsQueryDto) {
    await this.syncReminders(userId);
    const start = query.offset;
    const end = start + query.limit - 1;
    const [notificationsResult, totalResult, unreadResult] = await Promise.all([
      this.supabase.admin
        .from('notifications')
        .select(
          'id, user_id, type, title, message, priority, due_date, action_url, entity_id, dedupe_key, is_read, read_at, created_at',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(start, end),
      this.supabase.admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      this.supabase.admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
    ]);
    if (notificationsResult.error || totalResult.error || unreadResult.error) {
      throw new InternalServerErrorException('Unable to load notifications');
    }
    const rows = (notificationsResult.data ?? []) as NotificationDatabaseRow[];
    const total = totalResult.count ?? 0;
    const unreadCount = unreadResult.count ?? 0;
    return {
      data: rows.map(mapDatabaseNotification),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        unreadCount,
      },
    };
  }
  async getUnreadCount(userId: string) {
    await this.syncReminders(userId);
    const { count, error } = await this.supabase.admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve unread notification count',
      );
    }
    return { unreadCount: count ?? 0 };
  }
  async markAsRead(userId: string, notificationId: string) {
    const { data, error } = await this.supabase.admin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select(
        'id, user_id, type, title, message, priority, due_date, action_url, entity_id, dedupe_key, is_read, read_at, created_at',
      )
      .maybeSingle();
    if (error) {
      throw new InternalServerErrorException(
        'Unable to mark notification as read',
      );
    }
    if (!data) {
      throw new NotFoundException('Notification not found');
    }
    return {
      message: 'Notification marked as read',
      data: mapDatabaseNotification(data as NotificationDatabaseRow),
    };
  }
  async markAllAsRead(userId: string) {
    const readAt = new Date().toISOString();
    const { error } = await this.supabase.admin
      .from('notifications')
      .update({ is_read: true, read_at: readAt })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) {
      throw new InternalServerErrorException(
        'Unable to mark notifications as read',
      );
    }
    return { message: 'All notifications marked as read', unreadCount: 0 };
  }
  async syncReminders(userId: string): Promise<void> {
    const now = new Date();
    const today = isoDate(now);
    const serviceCutoff = isoDate(addDays(now, SERVICE_NOTICE_DAYS));
    const insuranceCutoff = isoDate(addDays(now, INSURANCE_NOTICE_DAYS));
    const goalCutoff = isoDate(addDays(now, FUND_GOAL_NOTICE_DAYS));
    const [vehicleResult, fundResult] = await Promise.all([
      this.supabase.admin
        .from('vehicles')
        .select('id, name, make, model, next_service, insurance_expiry')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .or(
          `next_service.lte.${serviceCutoff},insurance_expiry.lte.${insuranceCutoff}`,
        ),
      this.supabase.admin
        .from('car_funds')
        .select(
          'id, target_amount, currency, target_date, planned_contribution_amount, contribution_cadence, next_reminder_date, reminders_enabled',
        )
        .eq('user_id', userId)
        .maybeSingle(),
    ]);
    if (vehicleResult.error) {
      throw new InternalServerErrorException(
        'Unable to load vehicle reminders',
      );
    }
    if (fundResult.error) {
      throw new InternalServerErrorException(
        'Unable to load Car Fund reminders',
      );
    }
    const drafts: NotificationDraft[] = [];
    const vehicles = (vehicleResult.data ?? []) as NotificationVehicle[];
    for (const vehicle of vehicles) {
      const name = vehicleName(vehicle);
      if (vehicle.next_service && vehicle.next_service <= serviceCutoff) {
        const overdue = vehicle.next_service < today;
        drafts.push({
          type: 'service_due',
          title: overdue
            ? 'Vehicle service overdue'
            : 'Vehicle service due soon',
          message: overdue
            ? `${name} was due for service on ${vehicle.next_service}.`
            : `${name} is due for service on ${vehicle.next_service}.`,
          priority: overdue ? 'urgent' : 'normal',
          dueDate: vehicle.next_service,
          actionUrl: `/vehicles/${vehicle.id}/repairs/new`,
          entityId: vehicle.id,
          dedupeKey: `service:${vehicle.id}:${vehicle.next_service}`,
        });
      }
      if (
        vehicle.insurance_expiry &&
        vehicle.insurance_expiry <= insuranceCutoff
      ) {
        const overdue = vehicle.insurance_expiry < today;
        drafts.push({
          type: 'insurance_expiry',
          title: overdue
            ? 'Vehicle insurance expired'
            : 'Insurance expiry coming up',
          message: overdue
            ? `${name}'s insurance expired on ${vehicle.insurance_expiry}.`
            : `${name}'s insurance expires on ${vehicle.insurance_expiry}.`,
          priority: overdue ? 'urgent' : 'high',
          dueDate: vehicle.insurance_expiry,
          actionUrl: '/vehicles',
          entityId: vehicle.id,
          dedupeKey: `insurance:${vehicle.id}:${vehicle.insurance_expiry}`,
        });
      }
    }
    const fund = fundResult.data as NotificationFund | null;
    if (fund) {
      if (
        fund.reminders_enabled &&
        fund.next_reminder_date &&
        fund.next_reminder_date <= today
      ) {
        const balance = await this.loadFundBalance(userId, fund.id);
        if (balance < Number(fund.target_amount)) {
          const amount = fund.planned_contribution_amount
            ? `${fund.currency} ${Number(fund.planned_contribution_amount).toFixed(2)}`
            : null;
          drafts.push({
            type: 'car_fund_contribution',
            title: 'Car Fund contribution reminder',
            message: amount
              ? `Your ${fund.contribution_cadence} contribution of ${amount} is due.`
              : 'Your planned Car Fund contribution is due.',
            priority:
              daysUntil(fund.next_reminder_date, today) < -7
                ? 'high'
                : 'normal',
            dueDate: fund.next_reminder_date,
            actionUrl: '/car-fund',
            entityId: fund.id,
            dedupeKey: `fund-contribution:${fund.id}:${fund.next_reminder_date}`,
          });
        }
      }
      if (fund.target_date && fund.target_date <= goalCutoff) {
        const overdue = fund.target_date < today;
        drafts.push({
          type: 'car_fund_goal',
          title: overdue
            ? 'Car Fund goal date passed'
            : 'Car Fund goal date approaching',
          message: overdue
            ? `Your savings goal date was ${fund.target_date}.`
            : `Your savings goal date is ${fund.target_date}.`,
          priority: overdue ? 'high' : 'normal',
          dueDate: fund.target_date,
          actionUrl: '/car-fund',
          entityId: fund.id,
          dedupeKey: `fund-goal:${fund.id}:${fund.target_date}`,
        });
      }
    }
    if (drafts.length === 0) {
      return;
    }
    const records = drafts.map((draft) => ({
      user_id: userId,
      type: draft.type,
      title: draft.title,
      message: draft.message,
      priority: draft.priority,
      due_date: draft.dueDate,
      action_url: draft.actionUrl,
      entity_id: draft.entityId,
      dedupe_key: draft.dedupeKey,
    }));
    const { error } = await this.supabase.admin
      .from('notifications')
      .upsert(records, {
        onConflict: 'user_id,dedupe_key',
        ignoreDuplicates: false,
      });
    if (error) {
      throw new InternalServerErrorException('Unable to save notifications');
    }
  }
  private async loadFundBalance(
    userId: string,
    fundId: string,
  ): Promise<number> {
    let balance = 0;
    for (let from = 0; ; from += 1000) {
      const { data, error } = await this.supabase.admin
        .from('car_fund_contributions')
        .select('amount')
        .eq('fund_id', fundId)
        .eq('user_id', userId)
        .order('id')
        .range(from, from + 999);
      if (error) {
        throw new InternalServerErrorException(
          'Unable to load Car Fund notifications',
        );
      }
      balance += (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
      if ((data?.length ?? 0) < 1000) {
        return balance;
      }
    }
  }
}
