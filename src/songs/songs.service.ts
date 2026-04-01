import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm'; // ✅ In ajouté
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import { Song } from './songs.entity';
import { Artist } from 'src/artists/artist.entity'; // ✅ ajouté
import { CreateSongDto } from './dto/create-song-dto';
import { UpdateSongDto } from './dto/update-song.dto';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,

    // ✅ Repository Artist ajouté pour récupérer les artistes par IDs
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
  ) {}

  // ─────────────────────────────────────────
  // PAGINATION — GET /songs?page=1&limit=10
  // ─────────────────────────────────────────
  async paginate(options: IPaginationOptions): Promise<Pagination<Song>> {
    try {
      return await paginate<Song>(this.songsRepository, options);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la pagination des chansons',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // CREATE — POST /songs
  // ─────────────────────────────────────────
  async create(songDTO: CreateSongDto): Promise<Song> {
    try {
      const song = new Song();
      song.title = songDTO.title;
      song.releaseDate = songDTO.releaseDate;
      song.duration = songDTO.duration;
      song.lyrics = songDTO.lyrics ?? ''; // ✅ gère le cas undefined

      // ✅ On récupère les entités Artist depuis leurs IDs
      // findBy + In() → SELECT * FROM artists WHERE id IN (1, 2, ...)
      if (songDTO.artists && songDTO.artists.length > 0) {
        const artists = await this.artistsRepository.findBy({
          id: In(songDTO.artists),
        });
        // TypeORM gère automatiquement la table songs_artists
        song.artists = artists;
      }

      return await this.songsRepository.save(song);
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la création de la chanson',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // READ ALL — GET /songs
  // ─────────────────────────────────────────
  async findAll(): Promise<Song[]> {
    try {
      return await this.songsRepository.find({
        // ✅ On charge les artistes liés automatiquement
        relations: ['artists'],
      });
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des chansons',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // READ ONE — GET /songs/:id
  // ─────────────────────────────────────────
  async findOne(id: number): Promise<Song> {
    try {
      const song = await this.songsRepository.findOne({
        where: { id },
        relations: ['artists'], // ✅ charge les artistes liés
      });

      if (!song) {
        throw new HttpException(
          `Chanson avec l'ID ${String(id)} non trouvée`,
          HttpStatus.NOT_FOUND,
        );
      }

      return song;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la récupération de la chanson',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // UPDATE — PUT /songs/:id
  // ─────────────────────────────────────────
  async update(id: number, songDTO: UpdateSongDto): Promise<Song> {
    try {
      const song = await this.findOne(id);

      // On met à jour les champs simples
      song.title = songDTO.title ?? song.title;
      song.releaseDate = songDTO.releaseDate ?? song.releaseDate;
      song.duration = songDTO.duration ?? song.duration;
      song.lyrics = songDTO.lyrics ?? song.lyrics;

      // ✅ Si de nouveaux artistIds sont fournis → on met à jour la relation
      if (songDTO.artists && songDTO.artists.length > 0) {
        const artists = await this.artistsRepository.findBy({
          id: In(songDTO.artists),
        });
        song.artists = artists;
      }

      return await this.songsRepository.save(song);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la mise à jour de la chanson',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // DELETE — DELETE /songs/:id
  // ─────────────────────────────────────────
  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.songsRepository.delete(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la suppression de la chanson',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
