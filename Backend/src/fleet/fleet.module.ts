import { Module } from '@nestjs/common';
import { ExpensesModule } from '../expenses/expenses.module';
import { FleetDashboardController } from './fleet-dashboard.controller';
import { FleetController } from './fleet.controller';
import { FleetInvitationsController } from './fleet-invitations.controller';
import { FleetInvitationsService } from './fleet-invitations.service';
import { FleetService } from './fleet.service';

@Module({
  imports: [ExpensesModule],
  controllers: [
    FleetController,
    FleetDashboardController,
    FleetInvitationsController,
  ],
  providers: [FleetService, FleetInvitationsService],
})
export class FleetModule {}