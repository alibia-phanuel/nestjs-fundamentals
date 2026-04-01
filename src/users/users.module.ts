import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
// import { UsersController } from './users.controller'; // ✅ ajouté

@Module({
  imports: [
    // ✅ Repository<User> disponible dans ce module
    TypeOrmModule.forFeature([User]),
  ],
  //   controllers: [UsersController], // ✅ ajouté
  providers: [UsersService],
  exports: [UsersService], // ✅ exporté pour AuthModule
})
export class UsersModule {}
