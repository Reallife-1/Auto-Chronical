import { IsEmail } from 'class-validator';

export class CreateFleetInvitationDto {
  @IsEmail()
  email: string;
}
