import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

// ✅ On N'importe PAS User ni Song directement
@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;

  // ✅ String reference — TypeORM résout sans import direct
  @OneToMany('Song', 'playList')
  songs: any[];

  // ✅ String reference — TypeORM résout sans import direct
  @ManyToOne('User', 'playLists')
  user: any;
}
