import { Socket, Server as SocketIOServer } from 'socket.io';
import { mediasoupRouter, createWebRtcTransport, getRouterRtpCapabilities } from './server';
import * as mediasoup from 'mediasoup';

interface MediasoupSocket extends Socket {
  userId?: string;
  producerTransport?: mediasoup.types.WebRtcTransport;
  consumerTransport?: mediasoup.types.WebRtcTransport;
  producer?: mediasoup.types.Producer;
  consumer?: mediasoup.types.Consumer;
}

// Store transports and producers per socket
const socketTransports = new Map<string, {
  producerTransport?: mediasoup.types.WebRtcTransport;
  consumerTransport?: mediasoup.types.WebRtcTransport;
}>();

const socketProducers = new Map<string, mediasoup.types.Producer>();
const socketConsumers = new Map<string, mediasoup.types.Consumer>();

export function handleMediasoupEvents(socket: MediasoupSocket, io: SocketIOServer) {
  
  // Get router RTP capabilities
  socket.on('getRouterRtpCapabilities', (callback) => {
    try {
      const rtpCapabilities = getRouterRtpCapabilities();
      callback({ rtpCapabilities });
    } catch (error) {
      console.error('Error getting router RTP capabilities:', error);
      callback({ error: 'Failed to get router capabilities' });
    }
  });

  // Create WebRTC transport
  socket.on('createTransport', async (data: { type: 'producer' | 'consumer' }, callback) => {
    try {
      const { transport, params } = await createWebRtcTransport();
      
      // Store transport
      const socketId = socket.id;
      if (!socketTransports.has(socketId)) {
        socketTransports.set(socketId, {});
      }
      
      const transports = socketTransports.get(socketId)!;
      if (data.type === 'producer') {
        transports.producerTransport = transport;
        socket.producerTransport = transport;
      } else {
        transports.consumerTransport = transport;
        socket.consumerTransport = transport;
      }

      callback(params);
      console.info(`Created ${data.type} transport for socket ${socketId}`);
    } catch (error) {
      console.error('Error creating transport:', error);
      callback({ error: 'Failed to create transport' });
    }
  });

  // Connect transport
  socket.on('connectTransport', async (data: {
    type: 'producer' | 'consumer';
    dtlsParameters: mediasoup.types.DtlsParameters;
  }, callback) => {
    try {
      const transport = data.type === 'producer' 
        ? socket.producerTransport 
        : socket.consumerTransport;

      if (!transport) {
        throw new Error(`${data.type} transport not found`);
      }

      await transport.connect({ dtlsParameters: data.dtlsParameters });
      callback({ success: true });
      console.info(`Connected ${data.type} transport for socket ${socket.id}`);
    } catch (error) {
      console.error('Error connecting transport:', error);
      callback({ error: 'Failed to connect transport' });
    }
  });

  // Produce media
  socket.on('produce', async (data: {
    kind: mediasoup.types.MediaKind;
    rtpParameters: mediasoup.types.RtpParameters;
    appData?: any;
  }, callback) => {
    try {
      if (!socket.producerTransport) {
        throw new Error('Producer transport not found');
      }

      const producer = await socket.producerTransport.produce({
        kind: data.kind,
        rtpParameters: data.rtpParameters,
        appData: data.appData,
      });

      // Store producer
      socketProducers.set(socket.id, producer);
      socket.producer = producer;

      producer.on('transportclose', () => {
        console.info('Producer transport closed');
        socketProducers.delete(socket.id);
      });

      callback({ id: producer.id });
      console.info(`Created producer ${producer.id} for socket ${socket.id}`);
    } catch (error) {
      console.error('Error creating producer:', error);
      callback({ error: 'Failed to create producer' });
    }
  });

  // Consume media
  socket.on('consume', async (data: {
    rtpCapabilities: mediasoup.types.RtpCapabilities;
    producerSocketId: string;
  }, callback) => {
    try {
      if (!socket.consumerTransport) {
        throw new Error('Consumer transport not found');
      }

      const producer = socketProducers.get(data.producerSocketId);
      if (!producer) {
        throw new Error('Producer not found');
      }

      // Check if we can consume
      if (!mediasoupRouter.canConsume({
        producerId: producer.id,
        rtpCapabilities: data.rtpCapabilities,
      })) {
        throw new Error('Cannot consume');
      }

      const consumer = await socket.consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities: data.rtpCapabilities,
        paused: true,
      });

      // Store consumer
      socketConsumers.set(socket.id, consumer);
      socket.consumer = consumer;

      consumer.on('transportclose', () => {
        console.info('Consumer transport closed');
        socketConsumers.delete(socket.id);
      });

      consumer.on('producerclose', () => {
        console.info('Consumer producer closed');
        socket.emit('consumerClosed', { consumerId: consumer.id });
        socketConsumers.delete(socket.id);
        consumer.close();
      });

      callback({
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });

      console.info(`Created consumer ${consumer.id} for socket ${socket.id}`);
    } catch (error) {
      console.error('Error creating consumer:', error);
      callback({ error: 'Failed to create consumer' });
    }
  });

  // Resume consumer
  socket.on('consumerResume', async (data: { consumerId: string }, callback) => {
    try {
      const consumer = socket.consumer;
      if (!consumer || consumer.id !== data.consumerId) {
        throw new Error('Consumer not found');
      }

      await consumer.resume();
      callback({ success: true });
      console.info(`Resumed consumer ${data.consumerId}`);
    } catch (error) {
      console.error('Error resuming consumer:', error);
      callback({ error: 'Failed to resume consumer' });
    }
  });

  // Handle disconnect cleanup
  socket.on('disconnect', () => {
    // Clean up producer
    const producer = socketProducers.get(socket.id);
    if (producer) {
      producer.close();
      socketProducers.delete(socket.id);
    }

    // Clean up consumer
    const consumer = socketConsumers.get(socket.id);
    if (consumer) {
      consumer.close();
      socketConsumers.delete(socket.id);
    }

    // Clean up transports
    const transports = socketTransports.get(socket.id);
    if (transports) {
      if (transports.producerTransport) {
        transports.producerTransport.close();
      }
      if (transports.consumerTransport) {
        transports.consumerTransport.close();
      }
      socketTransports.delete(socket.id);
    }

    console.info(`Cleaned up Mediasoup resources for socket ${socket.id}`);
  });
}

export function getActiveProducers() {
  return Array.from(socketProducers.entries());
}

export function getActiveConsumers() {
  return Array.from(socketConsumers.entries());
}