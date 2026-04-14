import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadType } from '../../auth/types';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — createParamDecorator
//
// createParamDecorator crée un décorateur de paramètre
// comme @Body(), @Param(), @Request()... mais personnalisé
//
// data    → valeur passée au décorateur ex: @CurrentUser('email')
// context → contexte d'exécution (HTTP, WebSocket, GraphQL...)
// ─────────────────────────────────────────────────────────────
export const CurrentUser = createParamDecorator(
  (data: keyof PayloadType | undefined, context: ExecutionContext) => {
    // ✅ Récupère la requête HTTP depuis le contexte
    const request = context.switchToHttp().getRequest<{
      user: PayloadType;
    }>();

    const user = request.user;

    // ✅ Si on passe une clé → retourne juste ce champ
    // @CurrentUser('email') → retourne uniquement l'email
    // @CurrentUser()        → retourne tout le user
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
