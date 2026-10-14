import {
    IsIn, 
    IsOptional,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import {
    ISSUE_STATUSES
} from '../issues.constants';
import type { IssueStatus } from '../issues.constants';

export class ListIssuesQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsIn([...ISSUE_STATUSES], { message: 'status is not a valid issue status' })
    status?: IssueStatus;
}