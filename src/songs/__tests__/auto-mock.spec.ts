/* eslint-disable @typescript-eslint/unbound-method */
// src/songs/__tests__/auto-mock.spec.ts

import { SongsService } from '../songs.service';

// ✅ jest.mock() remplace TOUT le module par des jest.fn()
// → chaque méthode devient une fonction vide contrôlable
jest.mock('../songs.service');

describe('Auto Mock — jest.mock()', () => {
  // SongsService est maintenant entièrement mocké
  let service: SongsService;

  beforeEach(() => {
    // ✅ Crée une instance du service mocké
    service = new SongsService(
      {} as any, // ← repositories pas nécessaires car tout est mocké
      {} as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait créer un mock automatique de SongsService', () => {
    // ✅ Le service existe
    expect(service).toBeDefined();
  });

  it('devrait avoir toutes les méthodes mockées automatiquement', () => {
    // ✅ Chaque méthode est une jest.fn() automatiquement
    expect(jest.isMockFunction(service.create)).toBe(true);
    expect(jest.isMockFunction(service.findAll)).toBe(true);
    expect(jest.isMockFunction(service.findOne)).toBe(true);
    expect(jest.isMockFunction(service.update)).toBe(true);
    expect(jest.isMockFunction(service.remove)).toBe(true);
    expect(jest.isMockFunction(service.paginate)).toBe(true);
  });

  it('devrait retourner undefined par défaut', async () => {
    // ✅ Sans configuration → les méthodes retournent undefined
    const result = await service.findAll();
    expect(result).toBeUndefined();
  });

  it('devrait pouvoir configurer la valeur de retour', async () => {
    // 🎯 On configure ce que findAll() va retourner
    const mockSongs = [
      { id: 1, title: 'Starboy', artists: [] },
      { id: 2, title: 'Blinding Lights', artists: [] },
    ];

    // mockResolvedValue → configure la Promise de retour
    jest.spyOn(service, 'findAll').mockResolvedValue(mockSongs as any);

    const result = await service.findAll();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Starboy');
  });
});
