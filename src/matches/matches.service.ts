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

    // ensure scorer is in this match
    const inMatch = match.participants.some(
      (p) => p.participantId === dto.participantId,
    );
    if (!inMatch)
      throw new BadRequestException('Participant not in this match');

    // create score event
    const created = await this.prisma.scoreEvent.create({
      data: {
        matchId: id,
        participantId: dto.participantId,
        kind: dto.kind as unknown as $Enums.ScoreKind,
        point: 1,
      },
    });

    // check auto-win by reaching targetPoints
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
}
