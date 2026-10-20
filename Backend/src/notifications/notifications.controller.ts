import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListNotificationsQueryDto) {
    return this.notifications.list(user.id, query);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: User) {
    return this.notifications.getUnreadCount(user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: User) {
    return this.notifications.markAllAsRead(user.id);
  }

  @Patch(':notificationId/read')
  markAsRead(
    @CurrentUser() user: User,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notifications.markAsRead(user.id, notificationId);
  }
}
