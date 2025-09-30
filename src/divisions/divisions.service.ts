import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { $Enums } from '../../generated/prisma';
import { AddDivisionParticipantsDto } from './dto/add-division-participants.dto';

@Injectable()
export class DivisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDivisionDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: dto.tournamentId },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');

    return this.prisma.division.create({
      data: {
        tournamentId: dto.tournamentId,
        name: dto.name,
        bracketType: dto.bracketType as unknown as $Enums.BracketType,
        targetPoints: dto.targetPoints ?? 2,
        matchDurationSec: dto.matchDurationSec ?? 180,
      },
    });
  }

  findAllByTournament(tournamentId: string) {
    return this.prisma.division.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.division.findUnique({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.division.delete({ where: { id } });
  }

  async addParticipants(divisionId: string, dto: AddDivisionParticipantsDto) {
    const division = await this.prisma.division.findUnique({
      where: { id: divisionId },
    });
    if (!division) throw new NotFoundException('Division not found');

    await this.prisma.$transaction(
      dto.items.map((it) =>
        this.prisma.divisionParticipant.upsert({
          where: {
            divisionId_participantId: {
              divisionId,
              participantId: it.participantId,
            },
          },
          update: { seed: it.seed ?? null },
          create: {
            divisionId,
            participantId: it.participantId,
            seed: it.seed ?? null,
          },
        }),
      ),
    );

    return { message: 'Participants added' };
  }

  async resetParticipants(divisionId: string) {
    await this.prisma.divisionParticipant.deleteMany({ where: { divisionId } });
    return { message: 'Participants reset' };
  }

  // -------- Bracket Generation --------
  async generateBracket(divisionId: string) {
    const division = await this.prisma.division.findUnique({
      where: { id: divisionId },
      include: { tournament: true, participants: true },
    });
    if (!division) throw new NotFoundException('Division not found');

    const participants = await this.prisma.divisionParticipant.findMany({
      where: { divisionId },
      include: { participant: true },
      orderBy: { seed: 'asc' },
    });
    if (participants.length < 2) {
      throw new BadRequestException('At least 2 participants required');
    }

    if (division.bracketType === 'SINGLE_ELIMINATION') {
      return this.generateSingleElimination(
        divisionId,
        division.tournamentId,
        participants.map((p) => p.participantId),
      );
    }
    return this.generateRoundRobin(
      divisionId,
      division.tournamentId,
      participants.map((p) => p.participantId),
    );
  }

  private async generateSingleElimination(
    divisionId: string,
    tournamentId: string,
    participantIds: string[],
  ) {
    // Determine bracket size (next power of two)
    const n = participantIds.length;
    const size = 1 << Math.ceil(Math.log2(n));
    // Basic seeding with byes: pad with nulls
    const seeds = [...participantIds];
    while (seeds.length < size) seeds.push(null as unknown as string);

    // Pair seeds: 1 vs size, 2 vs size-1, etc.
    const pairs: Array<[string | null, string | null]> = [];
    for (let i = 0; i < size / 2; i++) {
      pairs.push([seeds[i] ?? null, seeds[size - 1 - i] ?? null]);
    }

    // Create first round matches
    const createdMatches = await this.prisma.$transaction(
      pairs.map((pair, idx) =>
        this.prisma.match.create({
          data: {
            tournamentId,
            divisionId,
            round: 1,
            order: idx + 1,
            status: 'SCHEDULED',
            participants: {
              create: [
                ...(pair[0]
                  ? [{ participantId: pair[0], side: 'RED' as $Enums.Side }]
                  : []),
                ...(pair[1]
                  ? [{ participantId: pair[1], side: 'WHITE' as $Enums.Side }]
                  : []),
              ],
            },
          },
        }),
      ),
    );

    // Build subsequent rounds skeleton
    let round = 2;
    let prevRoundMatches = createdMatches;
    while (prevRoundMatches.length > 1) {
      const nextRoundMatches = await this.prisma.$transaction(
        Array.from({ length: Math.ceil(prevRoundMatches.length / 2) }).map(
          (_, i) =>
            this.prisma.match.create({
              data: {
                tournamentId,
                divisionId,
                round,
                order: i + 1,
                status: 'SCHEDULED',
              },
            }),
        ),
      );

      // Link children to parent via parentMatchId
      await this.prisma.$transaction(
        prevRoundMatches.map((m, idx) =>
          this.prisma.match.update({
            where: { id: m.id },
            data: { parentMatchId: nextRoundMatches[Math.floor(idx / 2)].id },
          }),
        ),
      );

      prevRoundMatches = nextRoundMatches;
      round++;
    }

    return { message: 'Single-elimination bracket generated' };
  }

  private async generateRoundRobin(
    divisionId: string,
    tournamentId: string,
    participantIds: string[],
  ) {
    // Round-robin scheduling using circle method
    const ids = [...participantIds];
    if (ids.length % 2 === 1) ids.push('BYE');
    const n = ids.length;
    const rounds = n - 1;
    const half = n / 2;

    const created: string[] = [];

    for (let r = 0; r < rounds; r++) {
      const pairs: Array<[string, string]> = [];
      for (let i = 0; i < half; i++) {
        const a = ids[i];
        const b = ids[n - 1 - i];
        if (a !== 'BYE' && b !== 'BYE') pairs.push([a, b]);
      }

      // create matches for round r+1
      const matches = await this.prisma.$transaction(
        pairs.map((pair, idx) =>
          this.prisma.match.create({
            data: {
              tournamentId,
              divisionId,
              round: r + 1,
              order: idx + 1,
              status: 'SCHEDULED',
              participants: {
                create: [
                  { participantId: pair[0], side: 'RED' as $Enums.Side },
                  { participantId: pair[1], side: 'WHITE' as $Enums.Side },
                ],
              },
            },
          }),
        ),
      );
      created.push(...matches.map((m) => m.id));

      // rotate (keep first fixed)
      const fixed = ids[0];
      const rest = ids.slice(1);
      rest.unshift(rest.pop() as string);
      ids.splice(0, ids.length, fixed, ...rest);
    }

    return { message: 'Round-robin schedule generated' };
  }
}
