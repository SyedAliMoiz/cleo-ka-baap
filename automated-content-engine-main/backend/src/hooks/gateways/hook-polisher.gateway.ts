import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:3000',
        'https://ace.vyralab.com',
        'http://ace.vyralab.com',
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('WebSocket CORS blocked origin:', origin);
        callback(null, true); // Allow all for now to debug
      }
    },
    credentials: true,
  },
  namespace: '/hook-polisher',
})
export class HookPolisherGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HookPolisherGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(
      `Client connected: ${client.id}, handshake: ${JSON.stringify(client.handshake.headers)}`,
    );
    this.logger.log(`Client namespace: ${client.nsp.name}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat-${data.chatId}`);
    this.logger.log(`Client ${client.id} joined chat ${data.chatId}`);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`chat-${data.chatId}`);
    this.logger.log(`Client ${client.id} left chat ${data.chatId}`);
  }

  // Emit processing step updates with data
  emitProcessingUpdate(
    chatId: string,
    step: 'polishing' | 'fact-check' | 'hook-fact-check' | 'complete',
    processingStepData?: any,
  ) {
    const payload = processingStepData
      ? { step, processingStepData }
      : { step };
    this.server.to(`chat-${chatId}`).emit('processing-update', payload);
    this.logger.log(
      `Emitted processing update for chat ${chatId}: ${step}${processingStepData ? ' with data' : ''}`,
    );
  }

  // Emit when hooks are updated
  emitHooksUpdate(chatId: string, hooks: any[]) {
    this.server.to(`chat-${chatId}`).emit('hooks-update', { hooks });
    this.logger.log(`Emitted hooks update for chat ${chatId}`);
  }

  // Emit when processing is complete
  emitProcessingComplete(chatId: string) {
    this.server.to(`chat-${chatId}`).emit('processing-complete');
    this.logger.log(`Emitted processing complete for chat ${chatId}`);
  }
}
