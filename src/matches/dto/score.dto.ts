/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsIn, IsOptional, IsString } from 'class-validator';

export const ScoreKindValues = [
  'MEN',
  'KOTE',
  'DO',
  'TSUKI',
  'PENALTY',
] as const;
export type ScoreKind = (typeof ScoreKindValues)[number];

export class ScoreDto {
  // Người NHẬN điểm (được cộng điểm). Với PENALTY có thể bỏ trống và dùng foulByParticipantId
  @IsOptional()
  @IsString()
  participantId?: string;

  // Người phạm lỗi (chỉ dùng khi kind = PENALTY)
  @IsOptional()
  @IsString()
  foulByParticipantId?: string;

  @IsIn(ScoreKindValues)
  kind!: ScoreKind;
}
