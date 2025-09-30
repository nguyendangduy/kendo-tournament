import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { $Enums } from '../../generated/prisma';

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateParticipantDto) {
    if (dto.type === 'PLAYER' && !dto.playerId) {
      throw new BadRequestException('playerId required for PLAYER');
    }
    if (dto.type === 'TEAM' && !dto.teamId) {
      throw new BadRequestException('teamId required for TEAM');
    }

    // validate references
    if (dto.playerId) {
      const exists = await this.prisma.player.findUnique({
        where: { id: dto.playerId },
      });
      if (!exists) throw new NotFoundException('Player not found');
    }
    if (dto.teamId) {
      const exists = await this.prisma.team.findUnique({
        where: { id: dto.teamId },
      });
      if (!exists) throw new NotFoundException('Team not found');
    }

    return this.prisma.participant.create({
      data: {
        type: dto.type as unknown as $Enums.ParticipantType,
        playerId: dto.playerId ?? null,
        teamId: dto.teamId ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.participant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  remove(id: string) {
    return this.prisma.participant.delete({ where: { id } });
  }
}
