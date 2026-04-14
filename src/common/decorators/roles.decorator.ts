import { SetMetadata } from '@nestjs/common';

// ─────────────────────────────────────────────────────────────
// 💡 CONCEPT — SetMetadata
//
// SetMetadata attache des métadonnées à une route
// Ces métadonnées peuvent être lues par un Guard
// C'est comme coller une étiquette sur une porte
// Le guard vérifie l'étiquette avant de laisser entrer
// ─────────────────────────────────────────────────────────────
export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ✅ Usage :
// @Roles('admin', 'moderator')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Get('admin-only')
// getAdminData() { ... }
