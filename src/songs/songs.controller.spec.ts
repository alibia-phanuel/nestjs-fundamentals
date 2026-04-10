import { Test, TestingModule } from '@nestjs/testing';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song-dto';
import { Song } from './songs.entity';
import { PayloadType } from 'src/auth/types';
import { ArtistJwtGuard } from 'src/auth/guards/artist-jwt.guard';
import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';

// ─────────────────────────────────────────────────────────────
// 📦 describe principal — toutes les variables partagées
// sont déclarées ici pour être accessibles dans tous les tests
// ─────────────────────────────────────────────────────────────
describe('SongsController', () => {
  // 🎯 Le controller qu'on va tester
  let controller: SongsController;

  // 🎭 Faux SongsService — remplace le vrai service
  // jest.fn() crée une fonction vide qu'on peut surveiller
  const mockSongsService = {
    create: jest.fn(),
    paginate: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // 🎭 Faux provider CONNECTION
  // requis car le controller l'injecte via @Inject('CONNECTION')
  const mockConnection = {
    CONNECTION_STRING: 'mongodb://localhost:27017',
    DB: 'test',
    DBNAME: 'test',
  };

  // 🎭 Faux guards — bypasse l'authentification dans les tests
  // canActivate retourne true → toujours autorisé
  const mockGuard = { canActivate: jest.fn(() => true) };

  // ─────────────────────────────────────────────────────────────
  // 🔧 beforeEach — exécuté avant CHAQUE test
  // recrée un module NestJS de test propre à chaque fois
  // ─────────────────────────────────────────────────────────────
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [
        {
          // Remplace le vrai SongsService par notre mock
          provide: SongsService,
          useValue: mockSongsService,
        },
        {
          // Fournit le provider CONNECTION requis par le controller
          provide: 'CONNECTION',
          useValue: mockConnection,
        },
      ],
    })
      // Override des guards — évite de charger leurs dépendances
      // (JwtStrategy, PassportModule, ConfigService...)
      .overrideGuard(ArtistJwtGuard)
      .useValue(mockGuard)
      .overrideGuard(ApiKeyGuard)
      .useValue(mockGuard)
      .compile();

    // Récupère l'instance du controller depuis le module de test
    controller = module.get<SongsController>(SongsController);
  });

  // 🧹 afterEach — exécuté après CHAQUE test
  // remet tous les mocks à zéro pour éviter les effets de bord
  afterEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────────────────────
  // Test 1 — Le controller est bien instancié
  // ─────────────────────────────────────────────────────────────
  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — createSong()
  // On vérifie que le controller appelle bien le service
  // avec le bon DTO et retourne le bon résultat
  // ─────────────────────────────────────────────────────────────
  describe('createSong', () => {
    it('devrait créer une chanson et retourner la chanson créée', async () => {
      const dto: CreateSongDto = {
        title: 'Starboy',
        artists: [1, 2],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
      };

      const mockSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        artists: [],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
        lyrics: '',
      };

      // mockResolvedValue → simule une réponse async du service
      mockSongsService.create.mockResolvedValue(mockSong);

      // Faux objet request avec user connecté
      const mockReq = {
        user: {
          userId: 1,
          email: 'artist@test.com',
          artistId: 1,
        } as PayloadType,
      };

      const result = await controller.createSong(dto, mockReq as any);

      // ✅ Le service a été appelé avec le bon DTO
      expect(mockSongsService.create).toHaveBeenCalledWith(dto);
      // ✅ Le résultat retourné est correct
      expect(result).toEqual(mockSong);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — getAllSongs()
  // On vérifie la pagination et la limite max de 100
  // ─────────────────────────────────────────────────────────────
  describe('getAllSongs', () => {
    it('devrait retourner les chansons paginées', async () => {
      const mockPagination = {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      mockSongsService.paginate.mockResolvedValue(mockPagination);

      const result = await controller.getAllSongs(1, 10);

      // ✅ Le service paginate a été appelé avec les bons paramètres
      expect(mockSongsService.paginate).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockPagination);
    });

    it('devrait limiter à 100 chansons par page max', async () => {
      mockSongsService.paginate.mockResolvedValue({ items: [], meta: {} });

      // On envoie limit=200 → le controller doit le réduire à 100
      await controller.getAllSongs(1, 200);

      // ✅ Malgré limit=200 envoyé, le service reçoit limit=100
      expect(mockSongsService.paginate).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — getSongById()
  // ─────────────────────────────────────────────────────────────
  describe('getSongById', () => {
    it('devrait retourner une chanson par son ID', async () => {
      const mockSong = { id: 1, title: 'Starboy', artists: [] };
      mockSongsService.findOne.mockResolvedValue(mockSong);

      const result = await controller.getSongById(1);

      // ✅ Le service a été appelé avec le bon ID
      expect(mockSongsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSong);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — updateSong()
  // ─────────────────────────────────────────────────────────────
  describe('updateSong', () => {
    it('devrait mettre à jour une chanson', async () => {
      const updateDto = { title: 'Starboy (Remix)' };
      const updatedSong = { id: 1, title: 'Starboy (Remix)', artists: [] };

      mockSongsService.update.mockResolvedValue(updatedSong);

      const result = await controller.updateSong(1, updateDto);

      // ✅ Le service a été appelé avec l'ID et le bon DTO
      expect(mockSongsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedSong);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — deleteSong()
  // ─────────────────────────────────────────────────────────────
  describe('deleteSong', () => {
    it('devrait supprimer une chanson', async () => {
      mockSongsService.remove.mockResolvedValue(undefined);

      await controller.deleteSong(1);

      // ✅ Le service remove a été appelé avec le bon ID
      expect(mockSongsService.remove).toHaveBeenCalledWith(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — SpyOn
  // Différence avec jest.fn() :
  // jest.fn()     → remplace complètement une fonction
  // jest.spyOn()  → espionne une fonction existante
  //                 et peut optionnellement changer son retour
  // ─────────────────────────────────────────────────────────────
  describe('SpyOn — createSong', () => {
    it('devrait espionner songsService.create', async () => {
      const dto: CreateSongDto = {
        title: 'Starboy',
        artists: [1, 2],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
      };

      const mockSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        artists: [],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
        lyrics: '',
      };

      // spyOn espionne la méthode create de mockSongsService
      // mockResolvedValue → contrôle ce qu'elle retourne
      const spy = jest
        .spyOn(mockSongsService, 'create')
        .mockResolvedValue(mockSong);

      const mockReq = {
        user: {
          userId: 1,
          email: 'artist@test.com',
          artistId: 1,
        } as PayloadType,
      };

      const result = await controller.createSong(dto, mockReq as any);

      // ✅ L'espion confirme que create a été appelé avec le bon DTO
      expect(spy).toHaveBeenCalledWith(dto);
      // ✅ L'espion confirme qu'il a été appelé exactement 1 fois
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSong);

      // 🧹 mockRestore → remet la méthode originale en place
      // important avec spyOn contrairement à jest.fn()
      spy.mockRestore();
    });

    it('devrait gérer une erreur DB', async () => {
      const dto: CreateSongDto = {
        title: 'Starboy',
        artists: [1, 2],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
      };

      const mockReq = {
        user: {
          userId: 1,
          email: 'artist@test.com',
          artistId: 1,
        } as PayloadType,
      };

      // mockRejectedValue → simule une erreur async (ex: DB crash)
      const spy = jest
        .spyOn(mockSongsService, 'create')
        .mockRejectedValue(new Error('Connexion DB perdue'));

      // ✅ On vérifie que l'erreur remonte bien jusqu'au controller
      await expect(controller.createSong(dto, mockReq as any)).rejects.toThrow(
        'Connexion DB perdue',
      );

      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
}); // ← fermeture du describe principal
