import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { ScoreDto } from './dto/score.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Patch(':id/start')
  start(@Param('id') id: string) {
    return this.service.start(id);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.service.pause(id);
  }

  @Patch(':id/finish')
  finish(@Param('id') id: string) {
    return this.service.finish(id);
  }

  @Post(':id/score')
  score(@Param('id') id: string, @Body() dto: ScoreDto) {
    return this.service.score(id, dto);
  }
}
