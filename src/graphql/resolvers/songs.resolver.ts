import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Subscription, // ✅ ajout
} from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { SongModel } from '../models/song.model';
import { CreateSongInput } from '../inputs/create-song.input';
import { SongsService } from '../../songs/songs.service';
import { pubSub } from '../pubsub'; // ✅ ajout

@Resolver(() => SongModel)
export class SongsResolver {
  constructor(private readonly songsService: SongsService) {}

  // ─────────────────────────────────────────
  // QUERY — GET ALL
  // ─────────────────────────────────────────
  @Query(() => [SongModel], { name: 'songs' })
  async getSongs(): Promise<SongModel[]> {
    const songs = await this.songsService.findAll();
    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      duration: song.duration,
      lyrics: song.lyrics,
    }));
  }

  // ─────────────────────────────────────────
  // QUERY — GET ONE
  // ─────────────────────────────────────────
  @Query(() => SongModel, { name: 'song', nullable: true })
  async getSongById(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<SongModel | null> {
    try {
      const song = await this.songsService.findOne(id);
      return {
        id: song.id,
        title: song.title,
        duration: song.duration,
        lyrics: song.lyrics,
      };
    } catch {
      throw new NotFoundException(`Chanson ${String(id)} introuvable`);
    }
  }

  // ─────────────────────────────────────────
  // MUTATION — CREATE
  // ✅ On publie l'événement après création
  // ─────────────────────────────────────────
  @Mutation(() => SongModel, { name: 'createSong' })
  async createSong(
    @Args('createSongInput') input: CreateSongInput,
  ): Promise<SongModel> {
    if (!input.title || input.title.trim() === '') {
      throw new GraphQLError('Le titre est obligatoire', {
        extensions: {
          code: 'BAD_USER_INPUT',
          field: 'title',
          http: { status: 400 },
        },
      });
    }

    const song = await this.songsService.create({
      title: input.title,
      duration: input.duration,
      lyrics: input.lyrics,
      artists: [],
      releaseDate: new Date(),
    });

    const songModel: SongModel = {
      id: song.id,
      title: song.title,
      duration: song.duration,
      lyrics: song.lyrics,
    };

    // ✅ Publie l'événement 'songAdded'
    // Tous les abonnés recevront cette chanson automatiquement
    await pubSub.publish('songAdded', { songAdded: songModel });

    return songModel;
  }

  // ─────────────────────────────────────────
  // MUTATION — DELETE
  // ─────────────────────────────────────────
  @Mutation(() => Boolean, { name: 'deleteSong' })
  async deleteSong(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    try {
      await this.songsService.remove(id);
      return true;
    } catch {
      throw new NotFoundException(`Chanson ${String(id)} introuvable`);
    }
  }

  // ─────────────────────────────────────────
  // SUBSCRIPTION — songAdded
  // GraphQL :
  // subscription {
  //   songAdded {
  //     id
  //     title
  //     duration
  //   }
  // }
  // ─────────────────────────────────────────
  @Subscription(() => SongModel, {
    name: 'songAdded',
    // ✅ filter — optionnel, filtre les événements
    // ici on retourne tout mais on pourrait filtrer par artiste etc.
    filter: () => true,
  })
  songAdded() {
    // ✅ asyncIterableIterator → écoute l'événement 'songAdded'
    // chaque fois que pubSub.publish('songAdded') est appelé
    // cette subscription reçoit les données
    return pubSub.asyncIterableIterator('songAdded');
  }
  s;
}
