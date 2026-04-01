import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './artist.entity';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepo: Repository<Artist>, // ✅ readonly
  ) {}

  // Trouve un artiste par userId
  // Retourne null si le user n'est pas un artiste
  async findArtist(userId: number): Promise<Artist | null> {
    // ✅ | null
    try {
      return await this.artistRepo.findOneBy({
        user: { id: userId },
      });
    } catch (error) {
      throw new HttpException(
        "Erreur lors de la recherche de l'artiste",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
