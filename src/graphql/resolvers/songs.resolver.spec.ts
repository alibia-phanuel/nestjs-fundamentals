import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { SongsResolver } from './songs.resolver';
import { pubSub } from '../pubsub';
import { SongsService } from 'src/songs/songs.service';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT CLÉ — Unit Test Resolver
//
// Exactement comme le Unit Test Controller :
//   ✅ On mocke le SongsService
//   ✅ On mocke le PubSub
//   ✅ On teste la logique du Resolver isolément
//
// La différence avec le Controller :
//   Controller → reçoit HTTP Request
//   Resolver   → reçoit des arguments GraphQL directement
//   → Plus simple à tester ! Pas besoin de mocker les guards
// ─────────────────────────────────────────────────────────────
describe('SongsResolver', () => {
  let resolver: SongsResolver;

  // 🎭 Faux SongsService
  const mockSongsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  // 🎭 Faux PubSub — on ne veut pas de vraies connexions WebSocket
  jest.mock('../pubsub', () => ({
    pubSub: {
      publish: jest.fn(),
      asyncIterableIterator: jest.fn(),
    },
  }));
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // ✅ Le vrai Resolver — c'est lui qu'on teste
        SongsResolver,
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
      ],
    }).compile();

    resolver = module.get<SongsResolver>(SongsResolver);
  });

  afterEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────────────────────
  // Test de base
  // ─────────────────────────────────────────────────────────────
  it('devrait être défini', () => {
    expect(resolver).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — getSongs()
  // ─────────────────────────────────────────────────────────────
  describe('getSongs', () => {
    it('devrait retourner toutes les chansons mappées', async () => {
      const mockSongs = [
        {
          id: 1,
          title: 'Starboy',
          duration: '03:52',
          lyrics: 'Some lyrics',
          artists: [],
        },
        {
          id: 2,
          title: 'Blinding Lights',
          duration: '03:20',
          lyrics: '',
          artists: [],
        },
      ];

      mockSongsService.findAll.mockResolvedValue(mockSongs);

      const result = await resolver.getSongs();

      // ✅ Le resolver mappe correctement les entités vers les models
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Starboy',
        duration: '03:52',
        lyrics: 'Some lyrics',
      });
      expect(mockSongsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('devrait retourner un tableau vide si aucune chanson', async () => {
      mockSongsService.findAll.mockResolvedValue([]);

      const result = await resolver.getSongs();

      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — getSongById()
  // ─────────────────────────────────────────────────────────────
  describe('getSongById', () => {
    it('devrait retourner une chanson par son ID', async () => {
      const mockSong = {
        id: 1,
        title: 'Starboy',
        duration: '03:52',
        lyrics: 'Some lyrics',
        artists: [],
      };

      mockSongsService.findOne.mockResolvedValue(mockSong);

      const result = await resolver.getSongById(1);

      expect(mockSongsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: 1,
        title: 'Starboy',
        duration: '03:52',
        lyrics: 'Some lyrics',
      });
    });

    it('devrait lever une NotFoundException si chanson introuvable', async () => {
      // findOne lève une erreur → le resolver doit la convertir en NotFoundException
      mockSongsService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(resolver.getSongById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — createSong()
  // ─────────────────────────────────────────────────────────────
  describe('createSong', () => {
    it('devrait créer une chanson et publier sur pubSub', async () => {
      const input = {
        title: 'Starboy',
        duration: '03:52',
        lyrics: 'Some lyrics',
      };

      const mockSong = {
        id: 1,
        title: 'Starboy',
        duration: '03:52',
        lyrics: 'Some lyrics',
        artists: [],
        releaseDate: new Date(),
      };

      mockSongsService.create.mockResolvedValue(mockSong);

      // ✅ Mock pubSub.publish directement
      const publishSpy = jest.spyOn(pubSub, 'publish').mockResolvedValue();

      const result = await resolver.createSong(input);

      // ✅ Le service create a été appelé
      expect(mockSongsService.create).toHaveBeenCalledTimes(1);

      // ✅ pubSub.publish a été appelé avec le bon événement
      expect(publishSpy).toHaveBeenCalledWith('songAdded', {
        songAdded: {
          id: 1,
          title: 'Starboy',
          duration: '03:52',
          lyrics: 'Some lyrics',
        },
      });

      expect(result).toEqual({
        id: 1,
        title: 'Starboy',
        duration: '03:52',
        lyrics: 'Some lyrics',
      });
    });

    it('devrait lever une GraphQLError si le titre est vide', async () => {
      const input = {
        title: '', // ← titre vide
        duration: '03:52',
      };

      await expect(resolver.createSong(input)).rejects.toThrow(GraphQLError);

      // ✅ Le service NE doit PAS être appelé si validation échoue
      expect(mockSongsService.create).not.toHaveBeenCalled();
    });

    it('devrait lever une GraphQLError si le titre est juste des espaces', async () => {
      const input = {
        title: '   ', // ← espaces seulement
        duration: '03:52',
      };

      await expect(resolver.createSong(input)).rejects.toThrow(GraphQLError);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — deleteSong()
  // ─────────────────────────────────────────────────────────────
  describe('deleteSong', () => {
    it('devrait supprimer une chanson et retourner true', async () => {
      mockSongsService.remove.mockResolvedValue(undefined);

      const result = await resolver.deleteSong(1);

      expect(mockSongsService.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('devrait lever une NotFoundException si chanson introuvable', async () => {
      mockSongsService.remove.mockRejectedValue(new Error('Not found'));

      await expect(resolver.deleteSong(999)).rejects.toThrow(NotFoundException);

      expect(mockSongsService.remove).toHaveBeenCalledWith(999);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — songAdded() subscription
  // ─────────────────────────────────────────────────────────────
  describe('songAdded', () => {
    it('devrait retourner un asyncIterableIterator', () => {
      const mockIterator = { next: jest.fn() };
      jest
        .spyOn(pubSub, 'asyncIterableIterator')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .mockReturnValue(mockIterator as any);

      const result = resolver.songAdded();

      // ✅ asyncIterableIterator appelé avec le bon événement
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(pubSub.asyncIterableIterator).toHaveBeenCalledWith('songAdded');
      expect(result).toBe(mockIterator);
    });
  });
});
