import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PayloadType } from './types';
import { ArtistsService } from 'src/artists/artists.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService, // ✅ readonly
    private readonly jwtService: JwtService, // ✅ readonly
    private readonly artistsService: ArtistsService, // ✅ readonly
  ) {}

  async login(loginDTO: LoginDto): Promise<{ accessToken: string }> {
    try {
      // 1️⃣ Trouver le user par email
      const user = await this.userService.findByEmail(loginDTO.email);
      if (!user) {
        throw new UnauthorizedException('Email ou mot de passe incorrect');
      }
      // 2️⃣ Comparer le password avec le hash en DB
      const passwordMatched = await bcrypt.compare(
        loginDTO.password,
        user.password,
      );

      // 3️⃣ Password incorrect → 401
      if (!passwordMatched) {
        // ✅ Message générique — ne révèle pas si c'est email ou password
        throw new UnauthorizedException('Email ou mot de passe incorrect');
      }

      // 4️⃣ Construire le payload JWT de base
      // ✅ Destructuring au lieu de delete user.password
      const { password, ...userWithoutPassword } = user;
      const payload: PayloadType = {
        email: userWithoutPassword.email,
        userId: userWithoutPassword.id,
      };

      // 5️⃣ Vérifier si le user est aussi un artiste
      // → Si oui → ajouter artistId dans le payload
      const artist = await this.artistsService.findArtist(user.id);
      if (artist) {
        payload.artistId = artist.id;
        // Maintenant le token contiendra artistId !
        // → ArtistJwtGuard pourra vérifier ce champ
      }

      // 6️⃣ Générer et retourner le token JWT
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const accessToken: string = this.jwtService.sign(payload);
      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      throw new HttpException(
        'Erreur lors de la connexion',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
