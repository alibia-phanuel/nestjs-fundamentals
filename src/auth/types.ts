export interface PayloadType {
  email: string;
  userId: number;
  artistId?: number; // ← optionnel — seulement pour les artistes
}
