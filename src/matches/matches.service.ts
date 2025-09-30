import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums } from '../../generated/prisma';
import { ScoreDto } from './dto/score.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async start(id: string) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== 'SCHEDULED' && match.status !== 'PAUSED') {
      throw new BadRequestException('Match cannot be started');
    }
    return this.prisma.match.update({
      where: { id },
      data: { status: 'ONGOING', startedAt: match.startedAt ?? new Date() },
    });
  }

  async pause(id: string) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== 'ONGOING')
      throw new BadRequestException('Match is not ongoing');
    return this.prisma.match.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
  }

  async finish(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { participants: true, scores: true, division: true },
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status === 'FINISHED') return match;

    // compute totals
    const totals: Record<string, number> = {};
    for (const s of match.scores)
      totals[s.participantId] = (totals[s.participantId] ?? 0) + s.point;

    // determine winner by points (or null)
    const [a, b] = match.participants;
    let winner: string | null = null;
    if (a && b) {
      const ta = totals[a.participantId] ?? 0;
      const tb = totals[b.participantId] ?? 0;
      winner = ta === tb ? null : ta > tb ? a.participantId : b.participantId;
    }

    return this.prisma.match.update({
      where: { id },
      data: {
        status: 'FINISHED',
        endedAt: new Date(),
        winnerParticipantId: winner,
      },
    });
  }

  async score(id: string, dto: ScoreDto) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { participants: true, division: true },
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.status !== 'ONGOING')
      throw new BadRequestException('Match is not ongoing');

    const sides = match.participants;
    if (sides.length !== 2)
      throw new BadRequestException('Match must have 2 participants');

    let scorerId = dto.participantId ?? null;
    if (dto.kind === 'PENALTY') {
      if (!dto.foulByParticipantId)
        throw new BadRequestException(
          'foulByParticipantId required for PENALTY',
        );
      const other = sides.find(
        (p) => p.participantId !== dto.foulByParticipantId,
      );
      if (!other) throw new BadRequestException('Invalid foulByParticipantId');
      scorerId = other.participantId;
    }

    if (!scorerId) throw new BadRequestException('participantId is required');

    const inMatch = sides.some((p) => p.participantId === scorerId);
    if (!inMatch)
      throw new BadRequestException('Participant not in this match');

    const created = await this.prisma.scoreEvent.create({
      data: {
        matchId: id,
        participantId: scorerId,
        kind: dto.kind as unknown as $Enums.ScoreKind,
        point: 1,
      },
    });

    const target = match.targetPoints ?? match.division?.targetPoints ?? 2;
    const totals = await this.prisma.scoreEvent.groupBy({
      by: ['participantId'],
      where: { matchId: id },
      _sum: { point: true },
    });
    const reached = totals.find((t) => (t._sum.point ?? 0) >= target);
    if (reached) {
      await this.prisma.match.update({
        where: { id },
        data: {
          status: 'FINISHED',
          endedAt: new Date(),
          winnerParticipantId: reached.participantId,
        },
      });
    }

    return created;
  }

  async findByDivision(divisionId: string) {
    return this.prisma.match.findMany({
      where: { divisionId },
      orderBy: [{ round: 'asc' }, { order: 'asc' }],
      include: {
        participants: true,
        scores: true,
      },
    });
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        participants: true,
        scores: true,
        division: true,
      },
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }
}
