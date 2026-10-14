import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { bearerToken } from '../common/utils/bearer-token';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(SupabaseAuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  get(@CurrentUser() user: User) {
    return this.profile.get(user);
  }

  @Patch()
  update(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profile.update(user.id, dto);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferencesDto) {
    return this.profile.updatePreferences(user.id, dto);
  }

  @Post('change-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  changeEmail(
    @CurrentUser() user: User,
    @Body() dto: ChangeEmailDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.profile.changeEmail(user, bearerToken(authorization), {
      newEmail: dto.email,
    });
  }

  @Post('change-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  changePassword(
    @CurrentUser() user: User,
    @Body() { currentPassword, ...dto }: ChangePasswordDto & { currentPassword: string },
    @Headers('authorization') authorization?: string,
  ) {
    return this.profile.changePassword(user, bearerToken(authorization), {
      ...dto,
      currentPassword,
    });
  }

  @Post('revoke-all-sessions')
  @HttpCode(200)
  revokeAllSessions(@Headers('authorization') authorization?: string) {
    return this.profile.revokeAllSessions(bearerToken(authorization));
  }
}
