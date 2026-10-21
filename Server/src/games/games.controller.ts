import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { GamesService } from './games.service.js';
import {
  CreateGameDto,
  ListGamesQueryDto,
  UpdateGameDto,
} from './dto.js';

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  // ── public catalog (no auth — the storefront is browsable) ──────────────

  /** Active games, paginated. ?category=&search= filters supported. */
  @Get()
  listPublic(@Query() query: ListGamesQueryDto) {
    return this.games.listPublicGames(query).then((r) => ({
      data: r.data,
      meta: r.meta,
    }));
  }

  /** Distinct categories of active games. */
  @Get('categories')
  categories() {
    return this.games.listCategories().then((data) => ({ data }));
  }

  // ── admin management ────────────────────────────────────────────────────

  /** All games including INACTIVE/MAINTENANCE — admin catalog. */
  @Get('manage')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  listAll(@Query() query: ListGamesQueryDto) {
    return this.games.listAllGames(query).then((r) => ({
      data: r.data,
      meta: r.meta,
    }));
  }

  @Get('manage/:id')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  getForAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.games.getGameById(id).then((data) => ({ data }));
  }

  @Post()
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  create(@Body() dto: CreateGameDto) {
    return this.games.createGame(dto).then((data) => ({ data }));
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGameDto) {
    return this.games.updateGame(id, dto).then((data) => ({ data }));
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RequirePasswordChangedGuard, AdminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.games.deleteGame(id);
    return { data: { message: 'Game deleted' } };
  }

  /** Public single-game lookup by id or slug — must stay after fixed routes. */
  @Get(':idOrSlug')
  getPublic(@Param('idOrSlug') idOrSlug: string) {
    return this.games.getPublicGame(idOrSlug).then((data) => ({ data }));
  }
}
