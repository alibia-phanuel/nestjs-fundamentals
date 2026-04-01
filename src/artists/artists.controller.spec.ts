import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsController } from './artists.controller';

describe('ArtistsController', () => {
  let controller: ArtistsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtistsController],
    }).compile();

    controller = module.get<ArtistsController>(ArtistsController);
  });

  // ✅ Test 1
  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
