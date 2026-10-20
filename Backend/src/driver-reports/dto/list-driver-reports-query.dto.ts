import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export const DRIVER_REPORT_STATUSES = [
  'new',
  'logged',
  'dismissed',
] as const;

export type DriverReportStatus = (typeof DRIVER_REPORT_STATUSES)[number];

export class ListDriverReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([...DRIVER_REPORT_STATUSES])
  status?: DriverReportStatus;
}