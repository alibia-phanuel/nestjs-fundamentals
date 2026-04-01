import { Artist } from 'src/artists/artist.entity';
import { Playlist } from 'src/playlists/playlist.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  // 'date' → stocke uniquement la date Ex: "2019-11-29"
  @Column('date')
  releaseDate: Date; // ✅ releaseDate sans "d"

  // 'time' → stocke l'heure au format "HH:MM"
  // ✅ string car IsMilitaryTime valide "03:20" pas un objet Date
  @Column('time')
  duration: string; // ✅ string pas Date

  // nullable:true → lyrics est optionnel
  @Column({ nullable: true })
  lyrics: string;

  // Plusieurs Songs ←→ Plusieurs Artists
  // @JoinTable → Song est propriétaire → crée la table songs_artists
  @ManyToMany(
    (): typeof Artist => Artist,
    (artist: Artist) => artist.songs, // ✅ type explicite
    { cascade: true },
  )
  @JoinTable({ name: 'songs_artists' })
  artists: Artist[];

  // Plusieurs Songs ←→ Plusieurs Playlists
  // Pas de @JoinTable → Playlist est propriétaire
  @ManyToMany(
    (): typeof Playlist => Playlist,
    (playlist: Playlist) => playlist.songs, // ✅ type explicite
  )
  playList: Playlist[]; // ✅ tableau car ManyToMany
}
