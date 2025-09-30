import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { TournamentsModule } from './tournaments/tournaments.module';
import { DivisionsModule } from './divisions/divisions.module';
import { PlayersModule } from './players/players.module';
import { ParticipantsModule } from './participants/participants.module';
import { MatchesModule } from './matches/matches.module';

@Module({
  imports: [
    TournamentsModule,
    DivisionsModule,
    PlayersModule,
    ParticipantsModule,
    MatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
