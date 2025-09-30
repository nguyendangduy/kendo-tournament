import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePlayerDto) {
    return this.prisma.player.create({ data: dto });
  }

  findAll() {
    return this.prisma.player.findMany({ orderBy: { createdAt: 'desc' } });
  }

  remove(id: string) {
    return this.prisma.player.delete({ where: { id } });
  }
}
