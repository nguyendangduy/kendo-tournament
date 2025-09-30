/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const BracketTypeValues = ['SINGLE_ELIMINATION', 'ROUND_ROBIN'] as const;
export type BracketType = (typeof BracketTypeValues)[number];

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty()
  tournamentId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(BracketTypeValues)
  bracketType!: BracketType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  targetPoints?: number; // ippon to win

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(900)
  matchDurationSec?: number;
}
