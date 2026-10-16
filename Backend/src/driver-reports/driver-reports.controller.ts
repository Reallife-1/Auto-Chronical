
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import {
  CreateDriverReportDto,
  SubmitDriverReportDto,
} from './dto/create-driver-reports.dto';
import { ListDriverReportsQueryDto } from './dto/list-driver-reports-query.dto';
import { DriverReportsService } from './driver-reports.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class DriverReportsController {
  constructor(private readonly reports: DriverReportsService) {}

  @Post('driver-report')
  submitAtCollectionRoute(
    @CurrentUser() user: User,
    @Body() dto: SubmitDriverReportDto,
  ) {
    const { vehicleId, ...report } = dto;
    return this.reports.submit(user.id, vehicleId, report);
  }

  @Post('vehicles/:vehicleId/driver-reports')
  submit(
    @CurrentUser() user: User,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateDriverReportDto,
  ) {
    return this.reports.submit(user.id, vehicleId, dto);
  }

  @Get('driver-reports')
  listAuthorized(
    @CurrentUser() user: User,
    @Query() query: ListDriverReportsQueryDto,
  ) {
    return this.reports.listAuthorized(user.id, query);
  }

  @Get('driver-reports/:reportId')
  getOne(
    @CurrentUser() user: User,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ) {
    return this.reports.getOne(user.id, reportId);
  }

  @Get('vehicles/:vehicleId/driver-reports')
  list(
    @CurrentUser() user: User,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query() query: ListDriverReportsQueryDto,
  ) {
    return this.reports.list(user.id, vehicleId, query);
  }

  @Post('driver-reports/:reportId/convert')
  convert(
    @CurrentUser() user: User,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ) {
    return this.reports.convert(user.id, reportId);
  }

  @Post('driver-reports/:reportId/dismiss')
  dismiss(
    @CurrentUser() user: User,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ) {
    return this.reports.dismiss(user.id, reportId);
  }
}
