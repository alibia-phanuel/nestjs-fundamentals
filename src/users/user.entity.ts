import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// ✅ On N'importe PAS Playlist directement
// TypeORM résout la référence lazy via () => Playlist
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

  // ✅ () => Playlist — lazy reference, pas d'import direct
  @OneToMany('Playlist', 'user')
  playLists: any[];

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret: string;

  @Exclude()
  @Column({ nullable: true, unique: true })
  apiKey: string;
}
