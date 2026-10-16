import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@supabase/supabase-js';
import { CURRENT_TERMS_VERSION } from '../auth/auth.constants';
import { SupabaseService } from '../supabase/supabase.service';
import { AcceptFleetInvitationDto } from './dto/accept-fleet-invitation.dto';
import { CreateFleetInvitationDto } from './dto/create-fleet-invitation.dto';

const INVITATION_LIFETIME_DAYS = 7;

@Injectable()
export class FleetInvitationsService {
  private readonly logger = new Logger(FleetInvitationsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async create(
    ownerId: string,
    fleetId: string,
    dto: CreateFleetInvitationDto,
  ) {
    await this.assertFleetOwner(ownerId, fleetId);

    const email = dto.email.trim().toLowerCase();
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + INVITATION_LIFETIME_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: revokeError } = await this.supabase.admin
      .from('fleet_invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('fleet_id', fleetId)
      .eq('email', email)
      .is('accepted_at', null)
      .is('revoked_at', null);

    if (revokeError) {
      throw new InternalServerErrorException(
        'Unable to prepare fleet invitation',
      );
    }

    const { error: insertError } = await this.supabase.admin
      .from('fleet_invitations')
      .insert({
        fleet_id: fleetId,
        email,
        token_hash: tokenHash,
        invited_by: ownerId,
        expires_at: expiresAt,
      });

    if (insertError?.code === '23505') {
      throw new ConflictException(
        'A pending invitation already exists for this email and fleet',
      );
    }
    if (insertError) {
      this.logger.error(`Could not store fleet invitation for ${fleetId}`);
      throw new InternalServerErrorException('Unable to create fleet invitation');
    }

    const redirectTo = new URL(
      '/fleet-invitations/accept',
      this.config.getOrThrow<string>('FRONTEND_URL'),
    );
    redirectTo.searchParams.set('token', token);

    const { error: emailError } = await this.supabase
      .createAuthClient()
      .auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo.toString(),
          shouldCreateUser: true,
        },
      });

    if (emailError) {
      const { error: cleanupError } = await this.supabase.admin
        .from('fleet_invitations')
        .delete()
        .eq('token_hash', tokenHash);
      if (cleanupError) {
        this.logger.error(
          `Invitation email failed and invitation cleanup failed for ${fleetId}`,
        );
      }
      this.logger.error(`Could not send fleet invitation for ${fleetId}`);
      throw new InternalServerErrorException('Unable to send fleet invitation');
    }

    return {
      message: 'Fleet invitation email sent',
      email,
      expiresAt,
    };
  }

  async accept(user: User, dto: AcceptFleetInvitationDto) {
    if (!user.email || !user.email_confirmed_at) {
      throw new ForbiddenException(
        'Verify the invited email address before accepting the invitation',
      );
    }
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = this.hashToken(dto.token);
    const { data, error } = await this.supabase.admin.rpc(
      'accept_fleet_invitation',
      {
        p_token_hash: tokenHash,
        p_user_id: user.id,
        p_first_name: dto.firstName.trim(),
        p_last_name: dto.lastName.trim(),
        p_terms_version: CURRENT_TERMS_VERSION,
      },
    );

    if (error) {
      if (
        error.code === 'P0001' &&
        error.message.includes('fleet_invitation_not_found')
      ) {
        throw new NotFoundException('Fleet invitation is invalid or expired');
      }
      if (
        error.code === 'P0001' &&
        error.message.includes('fleet_invitation_email_mismatch')
      ) {
        throw new ForbiddenException(
          'This invitation was sent to a different email address',
        );
      }
      if (
        error.code === 'P0001' &&
        error.message.includes('fleet_invitation_already_accepted')
      ) {
        throw new ConflictException('Fleet invitation was already accepted');
      }
      if (
        error.code === 'P0001' &&
        error.message.includes('fleet_invitation_email_unverified')
      ) {
        throw new ForbiddenException(
          'Verify the invited email address before accepting the invitation',
        );
      }
      this.logger.error('Fleet invitation acceptance transaction failed');
      throw new InternalServerErrorException(
        'Unable to accept fleet invitation',
      );
    }
    if (!data) {
      throw new InternalServerErrorException(
        'Unable to accept fleet invitation',
      );
    }

    const { error: passwordError } =
      await this.supabase.admin.auth.admin.updateUserById(user.id, {
        password: dto.password,
      });
    if (passwordError) {
      this.logger.error(
        `Fleet invitation accepted but password setup failed for ${user.id}`,
      );
      throw new InternalServerErrorException(
        'Invitation accepted; retry to finish setting the account password',
      );
    }

    return {
      message: 'Fleet invitation accepted',
      fleetId: data.fleetId,
      userId: user.id,
    };
  }

  private async assertFleetOwner(ownerId: string, fleetId: string) {
    const { data, error } = await this.supabase.admin
      .from('fleets')
      .select('id')
      .eq('id', fleetId)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to verify fleet ownership');
    }
    if (!data) throw new NotFoundException('Fleet not found');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
