import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Subscription,
} from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { SongModel } from '../models/song.model';
import { CreateSongInput } from '../inputs/create-song.input';
import { SongsService } from '../../songs/songs.service';
import { pubSub } from '../pubsub';
import { ExternalApiService } from '../../external/external-api.service';

@Resolver(() => SongModel)
export class SongsResolver {
  constructor(
    private readonly songsService: SongsService,
    // ✅ ExternalApiService injecté
    private readonly externalApiService: ExternalApiService,
  ) {}

  // ─────────────────────────────────────────
  // QUERY — GET ALL
  // GraphQL : query { songs { id title duration } }
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
  // GraphQL : query { song(id: 1) { id title } }
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
  // QUERY — External API
  // GraphQL : query { artistInfo(name: "The Weeknd") }
  // ─────────────────────────────────────────
  @Query(() => String, { name: 'artistInfo', nullable: true })
  async getArtistInfo(@Args('name') name: string): Promise<string> {
    // ✅ On appelle l'API externe via ExternalApiService
    const data = await this.externalApiService.getArtistInfo(name);
    // ✅ On sérialise en JSON string car GraphQL
    // ne peut pas retourner un objet arbitraire directement
    return JSON.stringify(data);
  }

  // ─────────────────────────────────────────
  // MUTATION — CREATE
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

    // ✅ Publie pour les subscriptions
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
  // ─────────────────────────────────────────
  @Subscription(() => SongModel, {
    name: 'songAdded',
    filter: () => true,
  })
  songAdded() {
    return pubSub.asyncIterableIterator('songAdded');
  }
}
