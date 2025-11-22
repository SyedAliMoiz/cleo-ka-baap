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
  namespace: '/thread-writer',
})
export class ThreadWriterGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ThreadWriterGateway.name);

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
    this.logger.log(`Client ${client.id} joined thread writer chat ${data.chatId}`);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`chat-${data.chatId}`);
    this.logger.log(`Client ${client.id} left thread writer chat ${data.chatId}`);
  }

  // Emit processing step updates with data
  emitProcessingUpdate(
    chatId: string,
    step: 'thread-generation' | 'fact-check' | 'apply-transition' | 'evaluate-thread' | 'apply-changes' | 'complete',
    processingStepData?: any,
  ) {
    const payload = processingStepData
      ? { step, processingStepData }
      : { step };
    this.server.to(`chat-${chatId}`).emit('processing-update', payload);
    this.logger.log(
      `Emitted thread writer processing update for chat ${chatId}: ${step}${processingStepData ? ' with data' : ''}`,
    );
  }

  // Emit when processing is complete
  emitProcessingComplete(chatId: string) {
    this.server.to(`chat-${chatId}`).emit('processing-complete');
    this.logger.log(`Emitted thread writer processing complete for chat ${chatId}`);
  }

  // Emit thread updates
  emitThreadUpdate(chatId: string, thread: any) {
    this.server.to(`chat-${chatId}`).emit('thread-update', { thread });
    this.logger.log(`Emitted thread update for chat ${chatId}`);
  }
} 