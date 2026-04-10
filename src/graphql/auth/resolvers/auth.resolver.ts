import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { LoginResponse, UserResponse } from '../models/auth.model';
import { LoginInput } from '../inputs/login.input';
import { SignupInput } from '../inputs/signup.input';
import { AuthService } from '../../../auth/auth.service';
import { UsersService } from '../../../users/users.service';
import { GqlAuthGuard } from '../../guards/gql-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // ─────────────────────────────────────────
  // MUTATION — Signup
  // ─────────────────────────────────────────
  @Mutation(() => UserResponse, { name: 'signup' })
  async signup(
    @Args('signupInput') signupInput: SignupInput,
  ): Promise<UserResponse> {
    const user = await this.usersService.create({
      firstName: signupInput.firstName,
      lastName: signupInput.lastName,
      email: signupInput.email,
      password: signupInput.password,
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
    };
  }

  // ─────────────────────────────────────────
  // MUTATION — Login
  // ─────────────────────────────────────────
  @Mutation(() => LoginResponse, { name: 'login' })
  async login(
    @Args('loginInput') loginInput: LoginInput,
  ): Promise<LoginResponse> {
    const result = await this.authService.login({
      email: loginInput.email,
      password: loginInput.password,
    });

    // ✅ Correction — cast explicite pour satisfaire TypeScript
    const response = result as { accessToken?: string; message?: string };

    if (response.accessToken) {
      return { accessToken: response.accessToken };
    }

    // ✅ 2FA activé → pas de token direct
    return {
      accessToken: '',
      message: response.message ?? 'Code 2FA requis',
    };
  }

  // ─────────────────────────────────────────
  // QUERY — Me (profil du user connecté)
  // ─────────────────────────────────────────
  @Query(() => UserResponse, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async me(
    @Context() context: { req: { user: { userId: number } } },
  ): Promise<UserResponse> {
    const user = await this.usersService.findById(context.req.user.userId);

    // ✅ Correction — vérifie que user existe avant d'accéder à ses propriétés
    if (!user) {
      throw new NotFoundException('User introuvable');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
    };
  }
}
