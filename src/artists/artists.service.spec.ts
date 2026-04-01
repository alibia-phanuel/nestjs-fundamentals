import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsService } from './artists.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Artist } from './artist.entity';

describe('ArtistsService', () => {
  let service: ArtistsService;

  const mockArtistRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        {
          provide: getRepositoryToken(Artist),
          useValue: mockArtistRepo,
        },
      ],
    }).compile();

    service = module.get<ArtistsService>(ArtistsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ✅ Test 1
  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  // ✅ Test 2
  describe('findArtist', () => {
    it('devrait retourner un artiste si le userId existe', async () => {
      const mockArtist = { id: 1, songs: [] } as unknown as Artist;
      mockArtistRepo.findOneBy.mockResolvedValue(mockArtist);

      const result = await service.findArtist(1);

      expect(mockArtistRepo.findOneBy).toHaveBeenCalledWith({
        user: { id: 1 },
      });
      expect(result).toEqual(mockArtist);
    });

    it("devrait retourner null si le userId n'est pas un artiste", async () => {
      mockArtistRepo.findOneBy.mockResolvedValue(null);

      const result = await service.findArtist(999);

      expect(result).toBeNull();
    });
  });
});
