/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export const TournamentStatusValues = [
  'DRAFT',
  'REGISTRATION',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
] as const;
export type TournamentStatus = (typeof TournamentStatusValues)[number];

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsIn(TournamentStatusValues)
  status?: TournamentStatus;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}
