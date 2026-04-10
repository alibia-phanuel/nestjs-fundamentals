import { Test, TestingModule } from '@nestjs/testing';
import { SongsService } from './songs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Song } from './songs.entity';
import { Artist } from 'src/artists/artist.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT CLÉ — Unit Test Service
//
// Dans un Unit Test de SERVICE, on ne teste PAS :
//   ❌ La base de données réelle
//   ❌ Les controllers
//   ❌ Les guards
//
// On teste UNIQUEMENT :
//   ✅ La logique métier du service
//   ✅ Les appels aux repositories (mockés)
//   ✅ Les erreurs levées
//   ✅ Les cas limites (null, vide, erreur DB...)
//
// Le repository est mocké car on veut tester le SERVICE
// pas TypeORM — c'est le principe du test unitaire :
// isoler une seule unité de code
// ─────────────────────────────────────────────────────────────
describe('SongsService', () => {
  let service: SongsService;

  // 🎭 Faux Repository Song
  // On mocke TOUTES les méthodes utilisées dans le service
  // jest.fn() → fonction vide qu'on peut programmer à volonté
  const mockSongsRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    delete: jest.fn(),
  };

  // 🎭 Faux Repository Artist
  const mockArtistsRepository = {
    findBy: jest.fn(),
  };

  // ─────────────────────────────────────────────────────────────
  // 🔧 beforeEach — recrée le module avant chaque test
  // Garantit que chaque test part d'un état propre
  // ─────────────────────────────────────────────────────────────
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // ✅ Le VRAI service — c'est lui qu'on teste
        SongsService,
        {
          // getRepositoryToken(Song) → génère le token d'injection
          // TypeORM utilise ce token pour @InjectRepository(Song)
          // On remplace le vrai repo par notre mock
          provide: getRepositoryToken(Song),
          useValue: mockSongsRepository,
        },
        {
          provide: getRepositoryToken(Artist),
          useValue: mockArtistsRepository,
        },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
  });

  // 🧹 afterEach — remet TOUS les mocks à zéro
  // Sans ça → les appels s'accumulent entre les tests
  // Ex: toHaveBeenCalledTimes(1) pourrait retourner 3
  afterEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────────────────────
  // Test de base — vérifier que le service existe
  // ─────────────────────────────────────────────────────────────
  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — create()
  //
  // Cas à couvrir :
  // ✅ Création avec artistes
  // ✅ Création sans artistes
  // ✅ Création avec lyrics undefined
  // ✅ Erreur DB sur save
  // ✅ Erreur DB sur findBy artists
  // ✅ Artists IDs invalides (non trouvés en DB)
  // ─────────────────────────────────────────────────────────────
  describe('create', () => {
    // ─── Cas 1 — Création normale avec artistes ───
    it('devrait créer une chanson avec des artistes', async () => {
      const dto = {
        title: 'Starboy',
        artists: [1, 2],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
        lyrics: "Look what you've done...",
      };

      const mockArtists: Artist[] = [
        { id: 1, name: 'The Weeknd' } as unknown as Artist,
        { id: 2, name: 'Daft Punk' } as unknown as Artist,
      ];

      const mockSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        artists: mockArtists,
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
        lyrics: "Look what you've done...",
      };

      mockArtistsRepository.findBy.mockResolvedValue(mockArtists);
      mockSongsRepository.save.mockResolvedValue(mockSong);

      const result = await service.create(dto);

      // ✅ findBy appelé pour récupérer les artistes
      expect(mockArtistsRepository.findBy).toHaveBeenCalledTimes(1);
      // ✅ save appelé pour persister la chanson
      expect(mockSongsRepository.save).toHaveBeenCalledTimes(1);
      // ✅ Le résultat contient bien les artistes
      expect(result.artists).toHaveLength(2);
      expect(result).toEqual(mockSong);
    });

    // ─── Cas 2 — Création sans artistes ───
    it('devrait créer une chanson sans artistes', async () => {
      const dto = {
        title: 'Starboy',
        artists: [], // ← tableau vide
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

      mockSongsRepository.save.mockResolvedValue(mockSong);

      const result = await service.create(dto);

      // ✅ findBy NE doit PAS être appelé si artists est vide
      // C'est la logique : if (songDTO.artists && songDTO.artists.length > 0)
      expect(mockArtistsRepository.findBy).not.toHaveBeenCalled();
      expect(mockSongsRepository.save).toHaveBeenCalledTimes(1);
      expect(result.artists).toHaveLength(0);
    });

    // ─── Cas 3 — lyrics undefined → doit être remplacé par '' ───
    it('devrait remplacer lyrics undefined par une chaîne vide', async () => {
      const dto = {
        title: 'Starboy',
        artists: [],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
        // lyrics absent → undefined
      };

      mockSongsRepository.save.mockResolvedValue({ lyrics: '' });

      await service.create(dto);

      // ✅ On vérifie que save a été appelé avec lyrics = ''
      // et pas lyrics = undefined
      const savedSong = mockSongsRepository.save.mock.calls[0][0] as Song;
      expect(savedSong.lyrics).toBe('');
    });

    // ─── Cas 4 — Erreur DB sur save ───
    it('devrait lever une HttpException 500 si le save échoue', async () => {
      const dto = {
        title: 'Starboy',
        artists: [],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
      };

      // Simule un crash de la DB
      mockSongsRepository.save.mockRejectedValue(new Error('DB crashed'));

      // ✅ Le service doit attraper l'erreur et la convertir en HttpException
      await expect(service.create(dto)).rejects.toThrow(HttpException);
    });

    // ─── Cas 5 — Erreur DB sur findBy artists ───
    it('devrait lever une HttpException si findBy artists échoue', async () => {
      const dto = {
        title: 'Starboy',
        artists: [1, 2],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
      };

      // findBy artists crashe
      mockArtistsRepository.findBy.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(dto)).rejects.toThrow(HttpException);
    });

    // ─── Cas 6 — Artists IDs invalides (non trouvés) ───
    it('devrait créer la chanson même si certains artistIds sont invalides', async () => {
      const dto = {
        title: 'Starboy',
        artists: [999, 1000], // IDs qui n'existent pas
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
      };

      // findBy retourne tableau vide → IDs non trouvés
      mockArtistsRepository.findBy.mockResolvedValue([]);
      mockSongsRepository.save.mockResolvedValue({
        id: 1,
        title: 'Starboy',
        artists: [],
      });

      const result = await service.create(dto);

      // ✅ La chanson est créée mais sans artistes
      // Le service ne lève pas d'erreur — comportement attendu
      expect(result.artists).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — findOne()
  //
  // Cas à couvrir :
  // ✅ Chanson trouvée
  // ✅ Chanson non trouvée → 404
  // ✅ Erreur DB → 500
  // ✅ ID négatif
  // ✅ ID zéro
  // ─────────────────────────────────────────────────────────────
  describe('findOne', () => {
    // ─── Cas 1 — Chanson trouvée ───
    it('devrait retourner une chanson par son ID', async () => {
      const mockSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        artists: [],
      };

      mockSongsRepository.findOne.mockResolvedValue(mockSong);

      const result = await service.findOne(1);

      // ✅ findOne appelé avec le bon where ET les relations
      expect(mockSongsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['artists'],
      });
      expect(result).toEqual(mockSong);
    });

    // ─── Cas 2 — Chanson non trouvée → 404 ───
    it("devrait lever une 404 si la chanson n'existe pas", async () => {
      // null → chanson introuvable
      mockSongsRepository.findOne.mockResolvedValue(null);

      const promise = service.findOne(999);

      // ✅ Vérifie le type ET le status HTTP de l'erreur
      await expect(promise).rejects.toThrow(HttpException);
      await expect(promise).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    // ─── Cas 3 — Erreur DB → 500 ───
    it('devrait lever une 500 si la DB crashe', async () => {
      mockSongsRepository.findOne.mockRejectedValue(
        new Error('Connection lost'),
      );

      const promise = service.findOne(1);

      await expect(promise).rejects.toThrow(HttpException);
      await expect(promise).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    // ─── Cas 4 — ID zéro ───
    it('devrait lever une 404 pour ID = 0', async () => {
      mockSongsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(0)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — findAll()
  //
  // Cas à couvrir :
  // ✅ Retourne toutes les chansons
  // ✅ Retourne tableau vide si aucune chanson
  // ✅ Erreur DB → 500
  // ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    // ─── Cas 1 — Retourne toutes les chansons ───
    it('devrait retourner toutes les chansons avec leurs artistes', async () => {
      const mockSongs: Partial<Song>[] = [
        { id: 1, title: 'Starboy', artists: [] },
        { id: 2, title: 'Blinding Lights', artists: [] },
      ];

      mockSongsRepository.find.mockResolvedValue(mockSongs);

      const result = await service.findAll();

      // ✅ find appelé avec la relation artists
      expect(mockSongsRepository.find).toHaveBeenCalledWith({
        relations: ['artists'],
      });
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockSongs);
    });

    // ─── Cas 2 — Aucune chanson ───
    it('devrait retourner un tableau vide si aucune chanson', async () => {
      mockSongsRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      // ✅ Pas d'erreur — tableau vide est un résultat valide
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    // ─── Cas 3 — Erreur DB ───
    it('devrait lever une HttpException si la DB crashe', async () => {
      mockSongsRepository.find.mockRejectedValue(new Error('DB Error'));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — update()
  //
  // Cas à couvrir :
  // ✅ Mise à jour du titre uniquement
  // ✅ Mise à jour avec nouveaux artistes
  // ✅ Chanson non trouvée → 404
  // ✅ Erreur DB sur save → 500
  // ✅ DTO vide → chanson inchangée
  // ─────────────────────────────────────────────────────────────
  describe('update', () => {
    // ─── Cas 1 — Mise à jour du titre ───
    it("devrait mettre à jour le titre d'une chanson", async () => {
      const existingSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        artists: [],
        duration: '03:52',
        lyrics: '',
        releaseDate: new Date('2016-11-25'),
      };

      const updateDto = { title: 'Starboy (Remix)' };
      const updatedSong = { ...existingSong, title: 'Starboy (Remix)' };

      mockSongsRepository.findOne.mockResolvedValue(existingSong);
      mockSongsRepository.save.mockResolvedValue(updatedSong);

      const result = await service.update(1, updateDto);

      expect(mockSongsRepository.save).toHaveBeenCalledTimes(1);
      // ✅ Seul le titre a changé
      expect(result.title).toBe('Starboy (Remix)');
    });

    // ─── Cas 2 — Mise à jour avec nouveaux artistes ───
    it("devrait mettre à jour les artistes d'une chanson", async () => {
      const existingSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        artists: [],
      };

      const newArtists: Artist[] = [
        { id: 3, name: 'Drake' } as unknown as Artist,
      ];

      const updateDto = { artists: [3] };
      const updatedSong = { ...existingSong, artists: newArtists };

      mockSongsRepository.findOne.mockResolvedValue(existingSong);
      mockArtistsRepository.findBy.mockResolvedValue(newArtists);
      mockSongsRepository.save.mockResolvedValue(updatedSong);

      const result = await service.update(1, updateDto);

      // ✅ findBy appelé pour récupérer les nouveaux artistes
      expect(mockArtistsRepository.findBy).toHaveBeenCalledTimes(1);
      expect(result.artists).toHaveLength(1);
    });

    // ─── Cas 3 — Chanson non trouvée → 404 ───
    it("devrait lever une 404 si la chanson à modifier n'existe pas", async () => {
      mockSongsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { title: 'Test' }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });

    // ─── Cas 4 — DTO vide → chanson inchangée ───
    it('devrait garder les valeurs existantes si le DTO est vide', async () => {
      const existingSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        duration: '03:52',
        lyrics: 'Some lyrics',
        artists: [],
        releaseDate: new Date('2016-11-25'),
      };

      mockSongsRepository.findOne.mockResolvedValue(existingSong);
      mockSongsRepository.save.mockResolvedValue(existingSong);

      const result = await service.update(1, {});

      // ✅ Aucune valeur ne doit avoir changé
      expect(result.title).toBe('Starboy');
      expect(result.duration).toBe('03:52');
      expect(result.lyrics).toBe('Some lyrics');
    });

    // ─── Cas 5 — Erreur DB sur save ───
    it('devrait lever une 500 si le save échoue', async () => {
      const existingSong: Partial<Song> = {
        id: 1,
        title: 'Starboy',
        artists: [],
      };

      mockSongsRepository.findOne.mockResolvedValue(existingSong);
      mockSongsRepository.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.update(1, { title: 'Test' })).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — remove()
  //
  // Cas à couvrir :
  // ✅ Suppression réussie
  // ✅ Chanson non trouvée → 404
  // ✅ Erreur DB sur delete → 500
  // ✅ Vérifie que findOne est appelé avant delete
  // ─────────────────────────────────────────────────────────────
  describe('remove', () => {
    // ─── Cas 1 — Suppression réussie ───
    it('devrait supprimer une chanson existante', async () => {
      const mockSong: Partial<Song> = { id: 1, title: 'Starboy' };

      mockSongsRepository.findOne.mockResolvedValue(mockSong);
      mockSongsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      // ✅ findOne appelé AVANT delete — sécurité
      expect(mockSongsRepository.findOne).toHaveBeenCalledTimes(1);
      // ✅ delete appelé avec le bon ID
      expect(mockSongsRepository.delete).toHaveBeenCalledWith(1);
    });

    // ─── Cas 2 — Chanson non trouvée → 404 ───
    it("devrait lever une 404 si la chanson à supprimer n'existe pas", async () => {
      mockSongsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });

      // ✅ delete NE doit PAS être appelé si la chanson n'existe pas
      expect(mockSongsRepository.delete).not.toHaveBeenCalled();
    });

    // ─── Cas 3 — Erreur DB sur delete ───
    it('devrait lever une 500 si le delete échoue', async () => {
      const mockSong: Partial<Song> = { id: 1, title: 'Starboy' };

      mockSongsRepository.findOne.mockResolvedValue(mockSong);
      mockSongsRepository.delete.mockRejectedValue(new Error('DB Error'));

      await expect(service.remove(1)).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    // ─── Cas 4 — Vérifie l'ordre des appels ───
    it('devrait toujours appeler findOne avant delete', async () => {
      const mockSong: Partial<Song> = { id: 1, title: 'Starboy' };
      const callOrder: string[] = [];

      // On enregistre l'ordre des appels
      mockSongsRepository.findOne.mockImplementation(() => {
        callOrder.push('findOne');
        return mockSong;
      });

      mockSongsRepository.delete.mockImplementation(() => {
        callOrder.push('delete');
        return { affected: 1 };
      });

      await service.remove(1);

      // ✅ findOne doit être appelé AVANT delete — toujours !
      expect(callOrder).toEqual(['findOne', 'delete']);
    });
  });
});
