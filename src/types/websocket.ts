import { WebSocket } from 'ws';

// Extend the WebSocket interface to include an id property
export interface ExtendedWebSocket extends WebSocket {
  id: string;
}