import { Module } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { RepairsController } from '../repairs/repairs.controller';
import { RepairsService } from './repairs.service';
import { VehicleAccessModule } from '../common/vehicle-access/vehicle-access.module';

@Module({   
    imports: [VehicleAccessModule],
    controllers: [RepairsController],
    providers: [ReceiptsService, RepairsService],
})
export class RepairsModule {}