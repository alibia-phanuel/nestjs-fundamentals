import { Exclude } from 'class-transformer';
import { Playlist } from 'src/playlists/playlist.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  @Exclude()
  password: string;

  /**
   * A user can create many playLists
   */
  @OneToMany(() => Playlist, (playList) => playList.user)
  playLists: Playlist[];

  // ✅ Nouveau — le 2FA est-il activé ?
  // false par défaut — l'user doit l'activer manuellement
  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  // ✅ Nouveau — secret unique par user pour générer les codes
  // nullable car pas de 2FA par défaut
  @Column({ nullable: true })
  twoFactorSecret: string;

  // ✅ NOUVEAU — API Key unique par user
  // nullable car générée à la demande
  // unique car chaque Key doit être différente
  @Exclude() // ← jamais retournée dans les réponses JSON
  @Column({ nullable: true, unique: true })
  apiKey: string;
}
