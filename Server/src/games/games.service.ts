import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import { listMeta, pageParams } from '../common/pagination.js';
import type { Prisma } from '../generated/prisma/client.js';
import type {
  CreateGameDto,
  ListGamesQueryDto,
  UpdateGameDto,
} from './dto.js';

/** "Racing Simulator X" → "racing-simulator-x" */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── public catalog ──────────────────────────────────────────────────────

  /** Active games only — what customers browse and book. */
  async listPublicGames(query: ListGamesQueryDto) {
    const where: Prisma.GameWhereInput = { status: 'ACTIVE' };

    if (query.category) {
      where.category = {
        equals: query.category,
        mode: 'insensitive',
      };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = pageParams(query);
    const [total, data] = await Promise.all([
      this.prisma.game.count({ where }),
      this.prisma.game.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
    ]);

    return { data, meta: listMeta(total, query.page, query.limit) };
  }

  /** Distinct categories of active games (for filter chips). */
  async listCategories() {
    const rows = await this.prisma.game.findMany({
      where: { status: 'ACTIVE' },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category);
  }

  /** A single active game by id or slug. */
  async getPublicGame(idOrSlug: string) {
    const game = await this.prisma.game.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!game) {
      throw new ApiException(404, 'GAME_NOT_FOUND', 'Game not found');
    }
    return game;
  }

  // ── admin management ────────────────────────────────────────────────────

  /** All games regardless of status — admin catalog view. */
  async listAllGames(query: ListGamesQueryDto) {
    const where: Prisma.GameWhereInput = {};
    if (query.category) {
      where.category = {
        equals: query.category,
        mode: 'insensitive',
      };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = pageParams(query);
    const [total, data] = await Promise.all([
      this.prisma.game.count({ where }),
      this.prisma.game.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
    ]);

    return { data, meta: listMeta(total, query.page, query.limit) };
  }

  async getGameById(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new ApiException(404, 'GAME_NOT_FOUND', 'Game not found');
    }
    return game;
  }

  async createGame(input: CreateGameDto) {
    if (
      input.minBookingMins != null &&
      input.maxBookingMins != null &&
      input.minBookingMins > input.maxBookingMins
    ) {
      throw new ApiException(
        400,
        'INVALID_BOOKING_RANGE',
        'minBookingMins cannot exceed maxBookingMins',
      );
    }

    const slug = input.slug ?? slugify(input.name);
    const clash = await this.prisma.game.findUnique({ where: { slug } });
    if (clash) {
      throw new ApiException(
        409,
        'SLUG_IN_USE',
        'A game with this slug already exists',
      );
    }

    return this.prisma.game.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        category: input.category,
        imageUrl: input.imageUrl,
        pricePerHour: input.pricePerHour,
        minBookingMins: input.minBookingMins,
        maxBookingMins: input.maxBookingMins,
        capacity: input.capacity,
        status: input.status,
        sortOrder: input.sortOrder,
      },
    });
  }

  async updateGame(id: string, input: UpdateGameDto) {
    const existing = await this.getGameById(id);

    const minMins = input.minBookingMins ?? existing.minBookingMins;
    const maxMins = input.maxBookingMins ?? existing.maxBookingMins;
    if (minMins > maxMins) {
      throw new ApiException(
        400,
        'INVALID_BOOKING_RANGE',
        'minBookingMins cannot exceed maxBookingMins',
      );
    }

    if (input.slug) {
      const clash = await this.prisma.game.findUnique({
        where: { slug: input.slug },
      });
      if (clash && clash.id !== id) {
        throw new ApiException(
          409,
          'SLUG_IN_USE',
          'A game with this slug already exists',
        );
      }
    }

    return this.prisma.game.update({ where: { id }, data: input });
  }

  /**
   * Hard delete — fails with a friendly error when bookings reference the
   * game (FK is Restrict); set status INACTIVE instead in that case.
   */
  async deleteGame(id: string) {
    await this.getGameById(id);
    try {
      await this.prisma.game.delete({ where: { id } });
    } catch {
      throw new ApiException(
        409,
        'GAME_HAS_BOOKINGS',
        'This game has bookings — set it INACTIVE instead of deleting',
      );
    }
  }
}
