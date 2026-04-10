import { Module } from '@nestjs/common';
import { AuthResolver } from './resolvers/auth.resolver';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    // ✅ AuthModule — fournit AuthService
    AuthModule,
    // ✅ UsersModule — fournit UsersService
    UsersModule,
  ],
  providers: [AuthResolver],
})
export class AuthGraphqlModule {}
