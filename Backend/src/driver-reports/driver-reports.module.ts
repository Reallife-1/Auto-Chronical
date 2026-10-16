
import { Module } from '@nestjs/common';
import { VehicleAccessModule } from '../common/vehicle-access/vehicle-access.module';
import { DriverReportsController } from './driver-reports.controller';
import { DriverReportsService } from './driver-reports.service';

@Module({
  imports: [VehicleAccessModule],
  controllers: [DriverReportsController],
  providers: [DriverReportsService],
})
export class DriverReportsModule {}
