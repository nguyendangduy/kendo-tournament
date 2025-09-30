import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { ScoreDto } from './dto/score.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Get('division/:divisionId')
  listByDivision(@Param('divisionId') divisionId: string) {
    return this.service.findByDivision(divisionId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

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
