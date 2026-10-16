import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AcceptFleetInvitationDto } from './dto/accept-fleet-invitation.dto';
import { FleetInvitationsService } from './fleet-invitations.service';

@Controller('fleet-invitations')
@UseGuards(SupabaseAuthGuard)
export class FleetInvitationsController {
  constructor(private readonly invitations: FleetInvitationsService) {}

  @Post('accept')
  accept(
    @CurrentUser() user: User,
    @Body() dto: AcceptFleetInvitationDto,
  ) {
    return this.invitations.accept(user, dto);
  }
}
