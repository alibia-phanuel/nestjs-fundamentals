import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'; // ✅ nouveau
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { TwoFactorAuthService } from './2fa/two-factor-auth.service';
import { JwtAuthGuard } from './jwt-guard';
import { PayloadType } from './types';
import { User } from 'src/users/user.entity';
import { VerifyTwoFactorDto } from './2fa/dto/erify-2fa.dto';

interface RequestWithUser extends Request {
  user: PayloadType;
}

type UserWithoutPassword = Omit<User, 'password'>;

@ApiTags('Authentication') // ✅ groupe toutes les routes sous "Authentication"
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  // ─────────────────────────────────────────
  // POST /auth/signup
  // ─────────────────────────────────────────
  @Post('signup')
  @ApiOperation({
    summary: 'Créer un nouveau compte',
    description: 'Inscription avec firstName, lastName, email et password',
  })
  @ApiResponse({ status: 201, description: '✅ User créé avec succès' })
  @ApiResponse({ status: 400, description: '❌ Données invalides' })
  @ApiResponse({ status: 409, description: '❌ Email déjà utilisé' })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async signup(@Body() userDTO: CreateUserDTO): Promise<UserWithoutPassword> {
    try {
      return await this.userService.create(userDTO);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la création du compte',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/login
  // ─────────────────────────────────────────
  @Post('login')
  @ApiOperation({
    summary: 'Se connecter',
    description:
      'Retourne un token JWT si 2FA désactivé, sinon demande le code 2FA',
  })
  @ApiResponse({ status: 200, description: '✅ Token JWT retourné' })
  @ApiResponse({ status: 401, description: '❌ Identifiants incorrects' })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async login(
    @Body() loginDTO: LoginDto,
  ): Promise<{ accessToken: string } | { message: string }> {
    try {
      return await this.authService.login(loginDTO);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la connexion',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/2fa/setup
  // ─────────────────────────────────────────
  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') // ✅ route protégée JWT
  @ApiOperation({
    summary: 'Activer le 2FA',
    description: 'Génère un QR Code à scanner avec Google Authenticator',
  })
  @ApiResponse({ status: 200, description: '✅ QR Code retourné' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async setupTwoFactor(
    @Request() req: RequestWithUser,
  ): Promise<{ qrCodeUrl: string }> {
    try {
      const { secret, qrCodeUrl } =
        await this.twoFactorAuthService.generateTwoFactorSecret(req.user.email);
      await this.userService.enableTwoFactor(req.user.userId, secret);
      return { qrCodeUrl };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors du setup 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/2fa/verify
  // ─────────────────────────────────────────
  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') // ✅ route protégée JWT
  @ApiOperation({
    summary: 'Vérifier le code 2FA',
    description: 'Vérifie le code à 6 chiffres généré par Google Authenticator',
  })
  @ApiResponse({ status: 200, description: '✅ Code 2FA valide' })
  @ApiResponse({ status: 400, description: '❌ 2FA non activé' })
  @ApiResponse({ status: 401, description: '❌ Code invalide ou expiré' })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async verifyTwoFactor(
    @Request() req: RequestWithUser,
    @Body() verifyDto: VerifyTwoFactorDto,
  ): Promise<{ verified: boolean }> {
    try {
      const user = await this.userService.findById(req.user.userId);
      if (!user?.twoFactorSecret) {
        throw new HttpException(
          '2FA non activé pour ce compte',
          HttpStatus.BAD_REQUEST,
        );
      }
      const isValid = this.twoFactorAuthService.verifyTwoFactorCode(
        user.twoFactorSecret,
        verifyDto.code,
      );
      if (!isValid) {
        throw new HttpException(
          'Code 2FA invalide ou expiré',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return { verified: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la vérification 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/2fa/disable
  // ─────────────────────────────────────────
  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') // ✅ route protégée JWT
  @ApiOperation({ summary: 'Désactiver le 2FA' })
  @ApiResponse({ status: 200, description: '✅ 2FA désactivé' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async disableTwoFactor(
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    try {
      await this.userService.disableTwoFactor(req.user.userId);
      return { message: '2FA désactivé avec succès' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la désactivation du 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/generate-api-key
  // ─────────────────────────────────────────
  @Post('generate-api-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') // ✅ route protégée JWT
  @ApiOperation({
    summary: 'Générer une API Key',
    description: 'Génère une clé unique à passer dans le header X-API-KEY',
  })
  @ApiResponse({ status: 201, description: '✅ API Key générée' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async generateApiKey(
    @Request() req: RequestWithUser,
  ): Promise<{ apiKey: string }> {
    try {
      return await this.userService.generateApiKey(req.user.userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de la génération de l'API Key",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  // ─────────────────────────────────────────
  // POST /auth/revoke-api-key
  // ─────────────────────────────────────────
  @Post('revoke-api-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') // ✅ route protégée JWT
  @ApiOperation({
    summary: "Révoquer l'API Key",
    description: "Supprime l'API Key du user connecté",
  })
  @ApiResponse({ status: 200, description: '✅ API Key révoquée' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async revokeApiKey(
    @Request() req: RequestWithUser,
  ): Promise<{ message: string }> {
    try {
      return await this.userService.revokeApiKey(req.user.userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de la révocation de l'API Key",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
