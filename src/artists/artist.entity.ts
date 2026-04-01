import { Exclude } from 'class-transformer';
import { Song } from 'src/songs/songs.entity';
import { User } from 'src/users/user.entity';
import {
  Entity,
  JoinColumn,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn()
  id: number;

  // OneToOne avec User — unidirectionnel
  // @JoinColumn → crée la colonne userId dans la table artists
  // @Exclude → user ne sera jamais retourné dans la réponse JSON
  @Exclude()
  @OneToOne((): typeof User => User) // ✅ type explicite
  @JoinColumn()
  user: User;

  // ManyToMany avec Song — côté inverse
  // Pas de @JoinTable → Song est propriétaire
  @ManyToMany(
    (): typeof Song => Song,
    (song: Song) => song.artists, // ✅ type explicite
  )
  songs: Song[];
}
