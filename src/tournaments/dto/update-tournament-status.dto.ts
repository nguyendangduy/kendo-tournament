/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsIn } from 'class-validator';
import { TournamentStatusValues } from './create-tournament.dto';

export class UpdateTournamentStatusDto {
  @IsIn(TournamentStatusValues)
  status!: string;
}
