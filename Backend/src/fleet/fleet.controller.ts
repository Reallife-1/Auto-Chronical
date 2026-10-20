import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { CreateFleetInvitationDto } from './dto/create-fleet-invitation.dto';
import { FleetInvitationsService } from './fleet-invitations.service';
import { FleetService } from './fleet.service';

@Controller('fleets')
@UseGuards(SupabaseAuthGuard)
export class FleetController {
  constructor(
    private readonly fleets: FleetService,
    private readonly invitations: FleetInvitationsService,
  ) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateFleetDto) {
    return this.fleets.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: User) {
    return this.fleets.list(user.id);
  }

  @Post(':fleetId/vehicles/:vehicleId')
  assignVehicle(
    @CurrentUser() user: User,
    @Param('fleetId', ParseUUIDPipe) fleetId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.fleets.assignVehicle(user.id, fleetId, vehicleId);
  }

  @Post(':fleetId/invitations')
  inviteDriver(
    @CurrentUser() user: User,
    @Param('fleetId', ParseUUIDPipe) fleetId: string,
    @Body() dto: CreateFleetInvitationDto,
  ) {
    return this.invitations.create(user.id, fleetId, dto);
  }
}