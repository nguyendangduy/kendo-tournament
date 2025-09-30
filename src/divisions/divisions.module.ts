import { Module } from '@nestjs/common';
import { DivisionsController } from './divisions.controller';
import { DivisionsService } from './divisions.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DivisionsController],
  providers: [DivisionsService, PrismaService],
})
export class DivisionsModule {}
