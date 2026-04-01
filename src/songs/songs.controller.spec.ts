import { Test, TestingModule } from '@nestjs/testing';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song-dto';
import { Song } from './interfaces/song.interface';

describe('SongsController', () => {
  let controller: SongsController;

  const mockSongsService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
      ],
    }).compile();

    controller = module.get<SongsController>(SongsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSong', () => {
    it('should call songsService.create with correct DTO', () => {
      const dto: CreateSongDto = {
        title: 'Starboy',
        artist: ['The Weeknd'],
        releaseDate: new Date('2016-11-25'),
        duration: '03:52',
      };

      const expectedResult: Song[] = [dto as Song];
      mockSongsService.create.mockReturnValue(expectedResult);

      const result = controller.createSong(dto);

      // ✅ On utilise mockSongsService directement
      expect(mockSongsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAllSongs', () => {
    it('should return all songs', () => {
      const expectedSongs: Song[] = [
        {
          title: 'Starboy',
          artist: ['The Weeknd'],
          releaseDate: new Date('2016-11-25'),
          duration: '03:52',
        },
      ];

      mockSongsService.findAll.mockReturnValue(expectedSongs);

      const result = controller.getAllSongs();

      // ✅ On utilise mockSongsService directement
      expect(mockSongsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedSongs);
      expect(result).toBeInstanceOf(Array);
    });
  });
});
