/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; // ✅ génère des IDs uniques
import { User } from './user.entity';
import { CreateUserDTO } from './dto/create-user.dto';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userDTO: CreateUserDTO): Promise<UserWithoutPassword> {
    try {
      const existingUser = await this.userRepository.findOneBy({
        email: userDTO.email,
      });

      if (existingUser) {
        throw new HttpException(
          'Cet email est déjà utilisé',
          HttpStatus.CONFLICT,
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userDTO.password, salt);

      const user = this.userRepository.create({
        ...userDTO,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);
      const { password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de la création de l'utilisateur",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  // ─────────────────────────────────────────
  // ✅ NOUVEAU — Trouve un user par API Key
  // Utilisé par la stratégie API Key
  // ─────────────────────────────────────────
  async findByApiKey(apiKey: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ apiKey });
  }

  // ─────────────────────────────────────────
  // ✅ NOUVEAU — Génère une API Key unique
  // ─────────────────────────────────────────
  async generateApiKey(userId: number): Promise<{ apiKey: string }> {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      // Génère une API Key unique avec le format :
      // sk_live_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const apiKey = `sk_live_${uuidv4()}`;

      // Sauvegarde la Key en DB
      user.apiKey = apiKey;
      await this.userRepository.save(user);

      // ✅ Retourne la Key en clair UNE SEULE FOIS
      // Le user doit la sauvegarder car on ne peut plus la récupérer !
      return { apiKey };
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
  // ✅ NOUVEAU — Révoque l'API Key d'un user
  // ─────────────────────────────────────────
  async revokeApiKey(userId: number): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      // Supprime la Key en DB
      user.apiKey = '';
      await this.userRepository.save(user);

      return { message: 'API Key révoquée avec succès' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de la révocation de l'API Key",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async enableTwoFactor(
    userId: number,
    secret: string,
  ): Promise<UserWithoutPassword> {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      user.twoFactorSecret = secret;
      user.isTwoFactorEnabled = true;

      const savedUser = await this.userRepository.save(user);
      const { password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Erreur lors de l'activation du 2FA",
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async disableTwoFactor(userId: number): Promise<UserWithoutPassword> {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      user.twoFactorSecret = '';
      user.isTwoFactorEnabled = false;

      const savedUser = await this.userRepository.save(user);
      const { password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la désactivation du 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
