import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  constructor(private readonly usersService: UsersService) {
    super(
      {
        header: 'X-API-KEY',
        prefix: '',
      },
      false, // ✅ false → validate() reçoit (apiKey, done) simplement
    );
  }

  async validate(
    apiKey: string,
    done: (err: Error | null, user?: User | false) => void,
  ): Promise<void> {
    const user = await this.usersService.findByApiKey(apiKey);

    if (!user) {
      return done(new UnauthorizedException('API Key invalide'), false);
    }

    return done(null, user);
  }
}
