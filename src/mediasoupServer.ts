import { Server } from "http";
import { WebSocket } from "ws";
import { createWorker, types } from "mediasoup";
import { v4 as uuidv4 } from 'uuid';
import { mediaCodecs, webRtcTransportOptions } from "./utils/mediasoup.config";
import { ExtendedWebSocket } from "./types/websocket";
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs-extra';
import * as path from 'path';

const prisma = new PrismaClient();

let worker: types.Worker;
let router: types.Router;

// Maps to store client transports, producers, and consumers
const transports: Map<string, types.WebRtcTransport> = new Map();
const producers: Map<string, types.Producer> = new Map();
const consumers: Map<string, types.Consumer> = new Map();
const recordings: Map<string, { startTime: number; writeStream: fs.WriteStream }> = new Map();

export const setupMediasoup = async (httpServer: Server): Promise<void> => {
  const wss = new WebSocketServer({ server: httpServer });

  // Create mediasoup worker and router
  worker = await createWorker();
  router = await worker.createRouter({ mediaCodecs });

  console.log("🧠 MediaSoup worker and router ready");

  wss.on("connection", (ws: WebSocket) => {
    console.log("📡 New WebSocket client");

    // Cast to our extended WebSocket type
    const extWs = ws as ExtendedWebSocket;
    
    // Assign a unique ID to the WebSocket connection
    extWs.id = uuidv4();

    extWs.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("📩 Received WS message:", data);

        switch (data.action) {
          case "getRouterRtpCapabilities":
            extWs.send(JSON.stringify({
              action: "routerRtpCapabilities",
              data: router.rtpCapabilities,
            }));
            break;

          case "createTransport":
            const newTransport = await createTransport();
            transports.set(extWs.id, newTransport);
            
            extWs.send(JSON.stringify({
              action: "transportCreated",
              data: {
                id: newTransport.id,
                iceParameters: newTransport.iceParameters,
                iceCandidates: newTransport.iceCandidates,
                dtlsParameters: newTransport.dtlsParameters,
              },
            }));
            break;

          case "connectTransport":
            await connectTransport(extWs.id, data.dtlsParameters);
            extWs.send(JSON.stringify({
              action: "transportConnected",
            }));
            break;

          case "produce":
            const existingTransport = transports.get(extWs.id);
            if (!existingTransport) {
              throw new Error("Transport not found");
            }
            
            const newProducer = await createProducer(existingTransport, data);
            producers.set(newProducer.id, newProducer);
            
            extWs.send(JSON.stringify({
              action: "producerCreated",
              data: { id: newProducer.id },
            }));
            break;

          case "consume":
            const consumerTransport = transports.get(extWs.id);
            if (!consumerTransport) {
              throw new Error("Consumer transport not found");
            }

            const producerId = data.producerId;
            const producer = producers.get(producerId);
            if (!producer) {
              throw new Error("Producer not found");
            }

            const consumer = await createConsumer(consumerTransport, producer, data.rtpCapabilities);
            consumers.set(consumer.id, consumer);
            
            extWs.send(JSON.stringify({
              action: "consumerCreated",
              data: {
                id: consumer.id,
                producerId: producer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
              },
            }));
            break;

          case "switchToAudio":
          case "switchToVideo":
            await switchTrack(extWs.id, data.action);
            break;

          case "recordCall":
            await startRecordingCall(extWs, data.sessionId, data.type);
            break;

          case "stopRecording":
            await stopRecording(extWs.id);
            break;

          default:
            console.error("Unknown action:", data.action);
        }
      } catch (error: any) {
        console.error("Error processing message:", error);
        extWs.send(JSON.stringify({
          action: "error",
          error: error?.message || "Unknown error occurred",
        }));
      }
    });

    // Handle disconnection
    extWs.on("close", async () => {
      console.log(`Client ${extWs.id} disconnected`);
      await stopRecording(extWs.id);
      cleanup(extWs.id);
    });
  });
};

// Create transport for WebRTC communication
async function createTransport(): Promise<types.WebRtcTransport> {
  const transport = await router.createWebRtcTransport(webRtcTransportOptions);
  
  transport.on("dtlsstatechange", (dtlsState) => {
    if (dtlsState === "closed") {
      transport.close();
    }
  });

  return transport;
}

// Connect WebRTC transport
async function connectTransport(clientId: string, dtlsParameters: types.DtlsParameters): Promise<void> {
  const transport = transports.get(clientId);
  if (!transport) {
    throw new Error("Transport not found");
  }
  
  await transport.connect({ dtlsParameters });
}

// Create producer (audio/video track)
async function createProducer(transport: types.WebRtcTransport, data: any): Promise<types.Producer> {
  const { kind, rtpParameters } = data;
  const producer = await transport.produce({ kind, rtpParameters });
  
  return producer;
}

// Create consumer (for receiving the track)
async function createConsumer(
  transport: types.WebRtcTransport, 
  producer: types.Producer,
  rtpCapabilities: types.RtpCapabilities
): Promise<types.Consumer> {
  if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
    throw new Error("Cannot consume this producer");
  }
  
  const consumer = await transport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: false,
  });
  
  return consumer;
}

// Switch between video and audio tracks
async function switchTrack(clientId: string, action: string): Promise<void> {
  const producer = producers.get(clientId);
  if (producer) {
    if (action === "switchToAudio") {
      await producer.pause();
    } else if (action === "switchToVideo") {
      await producer.resume();
    }
  }
}

// Start recording the call
async function startRecordingCall(ws: ExtendedWebSocket, sessionId: string, type: string): Promise<void> {
  try {
    console.log("📽️ Starting call recording...");

    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(__dirname, '../recordings');
    await fs.ensureDir(recordingsDir);

    // Generate unique filename
    const filename = `${uuidv4()}.webm`;
    const filePath = path.join(recordingsDir, filename);
    
    // Create write stream for recording
    const writeStream = fs.createWriteStream(filePath);
    
    // Store recording information
    recordings.set(ws.id, {
      startTime: Date.now(),
      writeStream
    });

    // Get the producer for this client
    const producer = producers.get(ws.id);
    if (!producer) {
      throw new Error("No producer found for recording");
    }

    // Create a consumer for recording
    const recordingTransport = await router.createPlainTransport({
      listenIp: { ip: '127.0.0.1', announcedIp: '127.0.0.1' },
      rtcpMux: true,
      comedia: true
    });

    const consumer = await recordingTransport.consume({
      producerId: producer.id,
      rtpCapabilities: router.rtpCapabilities,
      paused: false
    });

    // Handle RTP packets
    consumer.on('rtp', (packet) => {
      writeStream.write(packet);
    });

    // Create database entry
    const recording = await prisma.sessionRecording.create({
      data: {
        sessionId,
        type,
        url: `/recordings/${filename}`,
      }
    });

    ws.send(JSON.stringify({ 
      action: "callRecordingStarted",
      data: { recordingId: recording.id }
    }));

  } catch (error: any) {
    console.error("Error starting recording:", error);
    ws.send(JSON.stringify({
      action: "error",
      error: error?.message || "Failed to start recording"
    }));
  }
}

// Stop recording
async function stopRecording(clientId: string): Promise<void> {
  const recording = recordings.get(clientId);
  if (recording) {
    const { startTime, writeStream } = recording;
    
    // Calculate duration
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    // Close write stream
    writeStream.end();
    
    // Update database record with duration
    await prisma.sessionRecording.updateMany({
      where: {
        sessionId: clientId,
        duration: null
      },
      data: {
        duration
      }
    });
    
    // Clean up recording entry
    recordings.delete(clientId);
  }
}

// Cleanup resources when client disconnects
function cleanup(clientId: string): void {
  // Close and remove transport
  const transport = transports.get(clientId);
  if (transport) {
    transport.close();
    transports.delete(clientId);
  }
  
  // Close and remove any producers associated with this client
  producers.forEach((producer, id) => {
    producer.close();
    producers.delete(id);
  });
  
  // Close and remove any consumers associated with this client
  consumers.forEach((consumer, id) => {
    consumer.close();
    consumers.delete(id);
  });
}

// Class definition for WebSocketServer
class WebSocketServer extends WebSocket.Server {
  constructor(options: { server: Server }) {
    super(options);
    }
  }
  