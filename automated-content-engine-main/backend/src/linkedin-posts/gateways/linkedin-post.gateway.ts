import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/linkedin-posts',
  cors: {
    origin: '*',
  },
})
export class LinkedInPostGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('LinkedInPostGateway');

  afterInit(server: Server) {
    this.logger.log('LinkedIn Post WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`LinkedIn Post Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`LinkedIn Post Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.chatId);
    this.logger.log(`LinkedIn Post Client ${client.id} joined chat ${data.chatId}`);
  }

  @SubscribeMessage('leave-chat')
  handleLeaveChat(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.chatId);
    this.logger.log(`LinkedIn Post Client ${client.id} left chat ${data.chatId}`);
  }

  // Method to emit processing updates to clients
  emitProcessingUpdate(
    chatId: string,
    step: 'processing' | 'fact-check' | 'evaluation' | 'optimization' | 'complete',
    processingStepData?: any,
  ) {
    this.logger.log(`Emitting LinkedIn Post processing update for chat ${chatId}: ${step}`);
    this.server.to(chatId).emit('processing-update', {
      step,
      processingStepData,
    });
  }

  // Method to emit when processing is complete
  emitProcessingComplete(chatId: string) {
    this.logger.log(`Emitting LinkedIn Post processing complete for chat ${chatId}`);
    this.server.to(chatId).emit('processing-complete');
  }

  // Method to emit post updates
  emitPostUpdate(chatId: string, posts: any[]) {
    this.logger.log(`Emitting LinkedIn Post update for chat ${chatId}`);
    this.server.to(chatId).emit('posts-update', { posts });
  }
} 