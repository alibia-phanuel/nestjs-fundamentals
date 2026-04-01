/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

// Type pour les données de setup 2FA
export interface TwoFactorSetup {
  secret: string; // ← secret à sauvegarder en DB
  qrCodeUrl: string; // ← image QR Code à afficher
  otpauthUrl: string; // ← URL pour Google Authenticator
}

@Injectable()
export class TwoFactorAuthService {
  // ─────────────────────────────────────────
  // GÉNÈRE le secret + QR Code pour un user
  // ─────────────────────────────────────────
  async generateTwoFactorSecret(email: string): Promise<TwoFactorSetup> {
    // 1️⃣ Génère un secret unique pour ce user
    // encoding: 'base32' → format standard pour les apps auth
    const secret = speakeasy.generateSecret({
      name: `SpotifyClone (${email})`, // ← nom affiché dans Google Auth
      length: 20,
    });

    // 2️⃣ Génère le QR Code à partir de l'URL otpauth
    // Le user va scanner ce QR Code avec Google Authenticator
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url ?? '');

    return {
      secret: secret.base32, // ← à sauvegarder en DB
      qrCodeUrl, // ← image base64 du QR Code
      otpauthUrl: secret.otpauth_url ?? '',
    };
  }

  // ─────────────────────────────────────────
  // VÉRIFIE le code entré par le user
  // ─────────────────────────────────────────
  verifyTwoFactorCode(
    secret: string, // ← secret stocké en DB
    code: string, // ← code entré par le user
  ): boolean {
    // speakeasy.totp.verify() → vérifie le code TOTP
    // window: 1 → accepte le code précédent et suivant
    // (compense les légères différences d'horloge)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }
}
