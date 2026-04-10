/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  // ✅ Override getRequest — récupère la requête depuis le contexte GraphQL
  // Sans ça → Passport cherche dans context.req HTTP standard
  // Avec ça → Passport trouve context.req dans le contexte GraphQL
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: Request }>().req;
  }
}
