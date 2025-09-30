import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums } from '../../generated/prisma';
import {
  CreateTournamentDto,
  TournamentStatusValues,
  TournamentStatus,
} from './dto/create-tournament.dto';

function isTournamentStatus(v: string): v is TournamentStatus {
  return (TournamentStatusValues as readonly string[]).includes(v);
}

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapStatus(status: TournamentStatus): $Enums.TournamentStatus {
    return status as $Enums.TournamentStatus;
  }

  create(dto: CreateTournamentDto) {
    const status = this.mapStatus(dto.status ?? 'DRAFT');
    return this.prisma.tournament.create({
      data: {
        name: dto.name,
        status,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      },
    });
  }

  findAll() {
    return this.prisma.tournament.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.tournament.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: string) {
    if (!isTournamentStatus(status)) {
      throw new Error('Invalid status');
    }
    return this.prisma.tournament.update({
      where: { id },
      data: { status: this.mapStatus(status) },
    });
  }

  remove(id: string) {
    return this.prisma.tournament.delete({ where: { id } });
  }
}
