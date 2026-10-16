import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service';

/**
 * The ONE place that decides "can this user work with this vehicle?".
 *
 * Right now (Personal MVP) only the owner can. When Fleet Mode arrives, change
 * this method to also allow fleet owners/managers (and, for reports, assigned
 * drivers). Nothing else in the issues module needs to change.

 */
@Injectable()
export class VehicleAccessService {
  constructor(private readonly supabase: SupabaseService) {}

  async listAccessibleVehicles(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('vehicles')
      .select('id, name, plate_number')
      .eq('owner_id', userId);

    if (error) {
      throw new InternalServerErrorException('Unable to load accessible vehicles');
    }

    return (data ?? []) as {
      id: string;
      name: string | null;
      plate_number: string | null;
    }[];
  }

  async assertCanAccess(userId: string, vehicleId: string): Promise<void> {
    const { data, error } = await this.supabase.admin
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to verify vehicle access');
    }

    // 404, not 403, so we don't reveal that someone else's vehicle exists.
    if (!data) {
      throw new NotFoundException('Vehicle not found');
    }
  }
}