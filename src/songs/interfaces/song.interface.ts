export interface Song {
  title: string;
  artists: string[];
  releaseDate: Date; // ✅ ajouté
  duration: string; // ✅ string car format "HH:MM"
  lyrics?: string;
}
