import {
    IsOptional,
    IsUUID,
    Matches
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class ListRepairsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must look like YYYY-MM-DD' })
    from?: string;

    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must look like YYYY-MM-DD' })
    to?: string;

    @IsOptional()
    @IsUUID()
    issueId?: string;
}