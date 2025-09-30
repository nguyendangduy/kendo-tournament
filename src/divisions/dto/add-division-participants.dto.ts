/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DivisionParticipantItemDto {
  @IsString()
  @IsNotEmpty()
  participantId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1024)
  seed?: number | null;
}

export class AddDivisionParticipantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DivisionParticipantItemDto)
  items!: DivisionParticipantItemDto[];
}
