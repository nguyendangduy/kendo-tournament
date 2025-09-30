/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsIn, IsOptional, IsString } from 'class-validator';

export const ParticipantTypeValues = ['PLAYER', 'TEAM'] as const;
export type ParticipantType = (typeof ParticipantTypeValues)[number];

export class CreateParticipantDto {
  @IsIn(ParticipantTypeValues)
  type!: ParticipantType;

  @IsOptional()
  @IsString()
  playerId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;
}
