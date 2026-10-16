import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { paginate } from '../common/pagination/paginate';
import { VehicleAccessService } from '../common/vehicle-access/vehicle-access.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { ListRepairsQueryDto } from './dto/list-repairs-query.dto';
import { DEFAULT_CURRENCY, REPAIR_COLUMNS } from './repairs.constants';
import { RepairPartRow, RepairRow, toRepairResponse } from './repairs.mapper';
import { ReceiptsService } from './receipts.service';
import { toMinor } from '../common/utils/money';

@Injectable()
export class RepairsService {
  private readonly logger = new Logger(RepairsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly access: VehicleAccessService,
    private readonly receipts: ReceiptsService,
  ) {}

  async create(
    userId: string,
    vehicleId: string,
    dto: CreateRepairDto,
    idempotencyKey?: string,
  ) {
    await this.access.assertCanAccess(userId, vehicleId);
    this.assertRepairDate(dto.repairDate);

    const currency = dto.currency ?? DEFAULT_CURRENCY;
    const amountMinor = toMinor(dto.amount, currency);
    // Parts are a breakdown of the repair amount, not an additional cost.
    const partsTotalMinor = (dto.parts ?? []).reduce(
      (sum, part) => sum + toMinor(part.amount, currency),
      0,
    );

    if (partsTotalMinor > amountMinor) {
      throw new BadRequestException(
        'Part amounts cannot add up to more than the repair amount',
      );
    }

    if (dto.issueId) {
      const { data, error } = await this.supabase.admin
        .from('issues')
        .select('id')
        .eq('id', dto.issueId)
        .eq('vehicle_id', vehicleId)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException('Unable to save repair');
      }

      if (!data) {
        throw new BadRequestException(
          'issueId does not belong to this vehicle',
        );
      }
    }

    // Reusing a key for the same user returns the original repair.
    const key = idempotencyKey?.trim().slice(0, 200) || undefined;

    if (key) {
      const existing = await this.findByKey(userId, key);
      if (existing) {
        return this.buildResponse(existing);
      }
    }

    const { data, error } = await this.supabase.admin
      .from('repairs')
      .insert({
        vehicle_id: vehicleId,
        issue_id: dto.issueId ?? null,
        recorded_by: userId,
        work_performed: dto.workPerformed.trim(),
        provider_name: dto.providerName?.trim() || null,
        repair_date: dto.repairDate,
        amount: dto.amount,
        currency: dto.currency ?? DEFAULT_CURRENCY,
        idempotency_key: key ?? null,
      })
      .select(REPAIR_COLUMNS)
      .single();

    if (error || !data) {
      // Concurrent retries race on the unique index; return the winning row.
      if (error?.code === '23505' && key) {
        const existing = await this.findByKey(userId, key);
        if (existing) {
          return this.buildResponse(existing);
        }
      }

      throw new InternalServerErrorException('Unable to save repair');
    }

    const repair = data as RepairRow;

    if (dto.parts?.length) {
      const { error: partsError } = await this.supabase.admin
        .from('repair_parts')
        .insert(
          dto.parts.map((part) => ({
            repair_id: repair.id,
            part_name: part.partName.trim(),
            amount: part.amount,
          })),
        );

      if (partsError) {
        this.logger.error(`Parts insert failed for repair ${repair.id}`);
        await this.supabase.admin.from('repairs').delete().eq('id', repair.id);
        throw new InternalServerErrorException('Unable to save repair');
      }
    }

    return this.buildResponse(repair);
  }

  async list(userId: string, vehicleId: string, query: ListRepairsQueryDto) {
    await this.access.assertCanAccess(userId, vehicleId);

    let request = this.supabase.admin
      .from('repairs')
      .select(REPAIR_COLUMNS, { count: 'exact' })
      .eq('vehicle_id', vehicleId);

    if (query.from) {
      request = request.gte('repair_date', query.from);
    }
    if (query.to) {
      request = request.lte('repair_date', query.to);
    }
    if (query.issueId) {
      request = request.eq('issue_id', query.issueId);
    }

    const { data, count, error } = await request
      .order('repair_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (error) {
      throw new InternalServerErrorException('Unable to load repairs');
    }

    const rows = (data ?? []) as RepairRow[];
    const ids = rows.map((row) => row.id);
    const partsByRepair = await this.loadParts(ids);
    const withReceipt = await this.receipts.repairIdsWithReceipt(ids);

    return paginate(
      rows.map((row) =>
        toRepairResponse(row, partsByRepair.get(row.id) ?? [], {
          hasReceipt: withReceipt.has(row.id),
        }),
      ),
      count ?? 0,
      query,
    );
  }

  async get(userId: string, repairId: string) {
    const repair = await this.findAuthorized(userId, repairId);
    return this.buildResponse(repair);
  }

  async uploadReceipt(
    userId: string,
    repairId: string,
    file?: Express.Multer.File,
  ) {
    await this.findAuthorized(userId, repairId);
    return this.receipts.attach(userId, repairId, file);
  }

  async removeReceipt(userId: string, repairId: string) {
    await this.findAuthorized(userId, repairId);
    return this.receipts.remove(repairId);
  }

  private async buildResponse(repair: RepairRow) {
    const partsByRepair = await this.loadParts([repair.id]);
    const media = await this.receipts.findForRepair(repair.id);

    return toRepairResponse(repair, partsByRepair.get(repair.id) ?? [], {
      receipt: media ? await this.receipts.toResponse(media) : null,
    });
  }

  private async loadParts(repairIds: string[]) {
    const byRepair = new Map<string, RepairPartRow[]>();

    if (repairIds.length === 0) {
      return byRepair;
    }

    const { data, error } = await this.supabase.admin
      .from('repair_parts')
      .select('id, repair_id, part_name, amount')
      .in('repair_id', repairIds)
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('Unable to load repairs');
    }

    for (const part of (data ?? []) as RepairPartRow[]) {
      const list = byRepair.get(part.repair_id) ?? [];
      list.push(part);
      byRepair.set(part.repair_id, list);
    }

    return byRepair;
  }

  private async findByKey(
    userId: string,
    key: string,
  ): Promise<RepairRow | null> {
    const { data, error } = await this.supabase.admin
      .from('repairs')
      .select(REPAIR_COLUMNS)
      .eq('recorded_by', userId)
      .eq('idempotency_key', key)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to save repair');
    }

    return (data as RepairRow) ?? null;
  }

  /** Loads a repair, then checks vehicle access. Returns 404 either way. */
  private async findAuthorized(
    userId: string,
    repairId: string,
  ): Promise<RepairRow> {
    const { data, error } = await this.supabase.admin
      .from('repairs')
      .select(REPAIR_COLUMNS)
      .eq('id', repairId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to load repair');
    }
    if (!data) {
      throw new NotFoundException('Repair not found');
    }

    const repair = data as RepairRow;

    try {
      await this.access.assertCanAccess(userId, repair.vehicle_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Repair not found');
      }
      throw error;
    }

    return repair;
  }

  /** Validates the calendar date and allows tomorrow for timezone differences. */
  private assertRepairDate(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('repairDate is not a valid date');
    }

    const limit = Date.now() + 24 * 60 * 60 * 1000;
    if (date.getTime() > limit) {
      throw new BadRequestException('repairDate cannot be in the future');
    }
  }
}
