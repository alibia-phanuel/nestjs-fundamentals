import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard API Key — protège les routes accessibles par API Key
// Utilisation : @UseGuards(ApiKeyGuard)
@Injectable()
export class ApiKeyGuard extends AuthGuard('api-key') {}
