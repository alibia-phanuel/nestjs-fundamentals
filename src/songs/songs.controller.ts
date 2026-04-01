import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song-dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './songs.entity';
import { Connection } from 'src/common/constants/connection';
import { Pagination } from 'nestjs-typeorm-paginate';
import { ArtistJwtGuard } from 'src/auth/guards/artist-jwt.guard';
import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';
import { PayloadType } from 'src/auth/types';

// Interface pour typer request.user
interface RequestWithUser extends Request {
  user: PayloadType;
}

@Controller('songs')
export class SongsController {
  // ✅ Logger NestJS au lieu de console.log
  private readonly logger = new Logger(SongsController.name);

  constructor(
    private readonly songsService: SongsService,
    @Inject('CONNECTION') private readonly connection: Connection,
  ) {
    this.logger.debug(`Connection: ${this.connection.CONNECTION_STRING}`);
  }

  // ─────────────────────────────────────────
  // CREATE — POST /songs
  // 🔒 Protégé — Artiste uniquement
  // ─────────────────────────────────────────
  @Post()
  @UseGuards(ArtistJwtGuard) // ✅ seuls les artistes peuvent créer
  async createSong(
    @Body() createSongDto: CreateSongDto,
    @Request() req: RequestWithUser,
  ): Promise<Song> {
    this.logger.debug(`Chanson créée par: ${req.user.email}`);
    return await this.songsService.create(createSongDto);
  }

  // ─────────────────────────────────────────
  // PAGINATION — GET /songs?page=1&limit=10
  // 🔑 Accessible par API Key OU JWT
  // ─────────────────────────────────────────
  @Get()
  @UseGuards(ApiKeyGuard) // ✅ accessible par API Key
  async getAllSongs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Pagination<Song>> {
    // Limite max 100 par page — sécurité contre les abus
    limit = limit > 100 ? 100 : limit;
    return await this.songsService.paginate({ page, limit });
  }

  // ─────────────────────────────────────────
  // READ ONE — GET /songs/:id
  // 🌐 Public — tout le monde peut voir une chanson
  // ─────────────────────────────────────────
  @Get(':id')
  async getSongById(@Param('id', ParseIntPipe) id: number): Promise<Song> {
    return await this.songsService.findOne(id);
  }

  // ─────────────────────────────────────────
  // UPDATE — PUT /songs/:id
  // 🔒 Protégé — Artiste uniquement
  // ─────────────────────────────────────────
  @Put(':id')
  @UseGuards(ArtistJwtGuard) // ✅ seuls les artistes peuvent modifier
  async updateSong(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongDto: UpdateSongDto,
  ): Promise<Song> {
    return await this.songsService.update(id, updateSongDto);
  }

  // ─────────────────────────────────────────
  // DELETE — DELETE /songs/:id
  // 🔒 Protégé — Artiste uniquement
  // ─────────────────────────────────────────
  @Delete(':id')
  @UseGuards(ArtistJwtGuard) // ✅ seuls les artistes peuvent supprimer
  async deleteSong(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.songsService.remove(id);
  }
}
