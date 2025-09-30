/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const ScoreKindValues = [
  'MEN',
  'KOTE',
  'DO',
  'TSUKI',
  'PENALTY',
] as const;
export type ScoreKind = (typeof ScoreKindValues)[number];

export class ScoreDto {
  @IsString()
  @IsNotEmpty()
  participantId!: string; // scorer

  @IsIn(ScoreKindValues)
  kind!: ScoreKind;

  // optional: timeSec, note can be added later
}
