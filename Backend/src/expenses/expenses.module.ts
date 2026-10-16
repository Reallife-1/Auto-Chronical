import { Module } from '@nestjs/common';
import { VehicleAccessModule } from '../common/vehicle-access/vehicle-access.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
    imports: [VehicleAccessModule],
    controllers: [ExpensesController],
    providers: [ExpensesService, ExchangeRateService],
})
export class ExpensesModule {}
