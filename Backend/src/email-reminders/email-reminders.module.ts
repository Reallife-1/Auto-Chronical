import { Module } from '@nestjs/common';
import { EmailRemindersService } from './email-reminders.service';

@Module({
  providers: [EmailRemindersService],
})
export class EmailRemindersModule {}
