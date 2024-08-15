import { Server } from 'socket.io';
import { SocketWithAuth } from 'src/modules/events/events.gateway';

export async function getClientByUserId(
  server: Server,
  userId: string,
): Promise<SocketWithAuth | null> {
  const sockets = server.sockets.sockets;

  for (const socket of sockets.values()) {
    if ((socket as SocketWithAuth).userId === userId) {
      return socket as SocketWithAuth;
    }
  }

  return null;
}
