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
} from '@nestjs/swagger';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PayloadType } from './types';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { TwoFactorAuthService } from './2fa/two-factor-auth.service';
import { JwtAuthGuard } from './jwt-guard';
import { User } from 'src/users/user.entity';
import { VerifyTwoFactorDto } from './2fa/dto/erify-2fa.dto';

type UserWithoutPassword = Omit<User, 'password'>;

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Créer un nouveau compte' })
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

  @Post('login')
  @ApiOperation({ summary: 'Se connecter' })
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

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activer le 2FA' })
  @ApiResponse({ status: 200, description: '✅ QR Code retourné' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async setupTwoFactor(
    @CurrentUser() user: PayloadType, // ✅ uniquement @CurrentUser
  ): Promise<{ qrCodeUrl: string }> {
    try {
      const { secret, qrCodeUrl } =
        await this.twoFactorAuthService.generateTwoFactorSecret(user.email); // ✅ user.email
      await this.userService.enableTwoFactor(user.userId, secret); // ✅ user.userId
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

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Vérifier le code 2FA' })
  @ApiResponse({ status: 200, description: '✅ Code 2FA valide' })
  @ApiResponse({ status: 400, description: '❌ 2FA non activé' })
  @ApiResponse({ status: 401, description: '❌ Code invalide ou expiré' })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async verifyTwoFactor(
    @CurrentUser() user: PayloadType, // ✅ @CurrentUser au lieu de @Request
    @Body() verifyDto: VerifyTwoFactorDto,
  ): Promise<{ verified: boolean }> {
    try {
      const dbUser = await this.userService.findById(user.userId);
      if (!dbUser?.twoFactorSecret) {
        throw new HttpException(
          '2FA non activé pour ce compte',
          HttpStatus.BAD_REQUEST,
        );
      }
      const isValid = this.twoFactorAuthService.verifyTwoFactorCode(
        dbUser.twoFactorSecret,
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

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Désactiver le 2FA' })
  @ApiResponse({ status: 200, description: '✅ 2FA désactivé' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async disableTwoFactor(
    @CurrentUser('userId') userId: number, // ✅ @CurrentUser
  ): Promise<{ message: string }> {
    try {
      await this.userService.disableTwoFactor(userId);
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

  @Post('generate-api-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Générer une API Key' })
  @ApiResponse({ status: 201, description: '✅ API Key générée' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async generateApiKey(
    @CurrentUser('userId') userId: number, // ✅ @CurrentUser
  ): Promise<{ apiKey: string }> {
    try {
      return await this.userService.generateApiKey(userId); // ✅ userId direct
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de la génération de l'API Key",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  @Post('revoke-api-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Révoquer l'API Key" })
  @ApiResponse({ status: 200, description: '✅ API Key révoquée' })
  @ApiResponse({
    status: 401,
    description: '❌ Token JWT manquant ou invalide',
  })
  @ApiResponse({ status: 500, description: '❌ Erreur serveur' })
  async revokeApiKey(
    @CurrentUser('userId') userId: number, // ✅ @CurrentUser
  ): Promise<{ message: string }> {
    try {
      return await this.userService.revokeApiKey(userId); // ✅ userId direct
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
