import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ListIssuesQueryDto } from './dto/list-issues-query.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { IssuesService } from './issues.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class IssuesController {
  constructor(private readonly issues: IssuesService) {}

  @Post('vehicles/:vehicleId/issues')
  create(
    @CurrentUser() user: User,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateIssueDto,
  ) {
    return this.issues.create(user.id, vehicleId, dto);
  }

  @Get('vehicles/:vehicleId/issues')
  list(
    @CurrentUser() user: User,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query() query: ListIssuesQueryDto,
  ) {
    return this.issues.list(user.id, vehicleId, query);
  }

  @Get('issues/:issueId')
  get(
    @CurrentUser() user: User,
    @Param('issueId', ParseUUIDPipe) issueId: string,
  ) {
    return this.issues.get(user.id, issueId);
  }

  @Patch('issues/:issueId/status')
  updateStatus(
    @CurrentUser() user: User,
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Body() dto: UpdateIssueStatusDto,
  ) {
    return this.issues.updateStatus(user.id, issueId, dto);
  }
}
