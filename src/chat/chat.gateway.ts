import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// ✅ @WebSocketGateway — équivalent de @Controller pour WebSocket
// port 3001 — séparé du port HTTP 3000
// cors: true — autorise les connexions depuis le frontend
@WebSocketGateway(3001, { cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  // ✅ @WebSocketServer — instance du serveur Socket.io
  // permet d'envoyer des messages à TOUS les clients connectés
  @WebSocketServer()
  server: Server ;

  // ─────────────────────────────────────────
  // Lifecycle — connexion / déconnexion
  // ─────────────────────────────────────────

  // Appelé automatiquement quand un client se connecte
  handleConnection(client: Socket) {
    this.logger.log(`Client connecté: ${client.id}`);
    // Informe le client qu'il est bien connecté
    client.emit('connected', {
      message: 'Bienvenue sur le serveur WebSocket !',
    });
  }

  // Appelé automatiquement quand un client se déconnecte
  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
  }

  // ─────────────────────────────────────────
  // Events — messages
  // ─────────────────────────────────────────

  // ✅ @SubscribeMessage — écoute l'événement 'message'
  // Quand le client fait socket.emit('message', data) → cette méthode est appelée
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { text: string; author: string },
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Message reçu de ${client.id}: ${data.text}`);

    // ✅ Broadcast — envoie le message à TOUS les clients connectés
    this.server.emit('message', {
      text: data.text,
      author: data.author,
      timestamp: new Date().toISOString(),
      clientId: client.id,
    });
  }

  // ✅ Event typing — écoute l'événement 'typing'
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { author: string },
    @ConnectedSocket() client: Socket,
  ): void {
    // Broadcast à tous SAUF l'émetteur
    client.broadcast.emit('typing', { author: data.author });
  }
}
