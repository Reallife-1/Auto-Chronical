import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { FleetDashboardQueryDto } from './dto/fleet-dashboard-query.dto';
import { FleetService } from './fleet.service';

@Controller('fleet')
@UseGuards(SupabaseAuthGuard)
export class FleetDashboardController {
  constructor(private readonly fleets: FleetService) {}

  @Get('dashboard')
  dashboard(
    @CurrentUser() user: User,
    @Query() query: FleetDashboardQueryDto,
  ) {
    return this.fleets.dashboard(user.id, query);
  }
}
