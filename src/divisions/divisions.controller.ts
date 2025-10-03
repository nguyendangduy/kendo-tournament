import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { AddDivisionParticipantsDto } from './dto/add-division-participants.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('divisions')
@ApiBearerAuth()
@Controller('divisions')
export class DivisionsController {
  constructor(private readonly service: DivisionsService) {}

  @Post()
  create(@Body() dto: CreateDivisionDto) {
    return this.service.create(dto);
  }

  @Post(':id/participants')
  addParticipants(
    @Param('id') id: string,
    @Body() dto: AddDivisionParticipantsDto,
  ) {
    return this.service.addParticipants(id, dto);
  }

  @Post(':id/participants/reset')
  resetParticipants(@Param('id') id: string) {
    return this.service.resetParticipants(id);
  }

  @Post(':id/generate-bracket')
  generate(@Param('id') id: string) {
    return this.service.generateBracket(id);
  }

  @Get('tournament/:tournamentId')
  findAllByTournament(@Param('tournamentId') tournamentId: string) {
    return this.service.findAllByTournament(tournamentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
