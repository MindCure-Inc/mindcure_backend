"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMediasoup = void 0;
const ws_1 = require("ws");
const mediasoup_1 = require("mediasoup");
const uuid_1 = require("uuid");
const mediasoup_config_1 = require("./utils/mediasoup.config");
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
let worker;
let router;
// Maps to store client transports, producers, and consumers
const transports = new Map();
const producers = new Map();
const consumers = new Map();
const recordings = new Map();
const setupMediasoup = (httpServer) => __awaiter(void 0, void 0, void 0, function* () {
    const wss = new WebSocketServer({ server: httpServer });
    // Create mediasoup worker and router
    worker = yield (0, mediasoup_1.createWorker)();
    router = yield worker.createRouter({ mediaCodecs: mediasoup_config_1.mediaCodecs });
    console.log("🧠 MediaSoup worker and router ready");
    wss.on("connection", (ws) => {
        console.log("📡 New WebSocket client");
        // Cast to our extended WebSocket type
        const extWs = ws;
        // Assign a unique ID to the WebSocket connection
        extWs.id = (0, uuid_1.v4)();
        extWs.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
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
                        const newTransport = yield createTransport();
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
                        yield connectTransport(extWs.id, data.dtlsParameters);
                        extWs.send(JSON.stringify({
                            action: "transportConnected",
                        }));
                        break;
                    case "produce":
                        const existingTransport = transports.get(extWs.id);
                        if (!existingTransport) {
                            throw new Error("Transport not found");
                        }
                        const newProducer = yield createProducer(existingTransport, data);
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
                        const consumer = yield createConsumer(consumerTransport, producer, data.rtpCapabilities);
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
                        yield switchTrack(extWs.id, data.action);
                        break;
                    case "recordCall":
                        yield startRecordingCall(extWs, data.sessionId, data.type);
                        break;
                    case "stopRecording":
                        yield stopRecording(extWs.id);
                        break;
                    default:
                        console.error("Unknown action:", data.action);
                }
            }
            catch (error) {
                console.error("Error processing message:", error);
                extWs.send(JSON.stringify({
                    action: "error",
                    error: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error occurred",
                }));
            }
        }));
        // Handle disconnection
        extWs.on("close", () => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`Client ${extWs.id} disconnected`);
            yield stopRecording(extWs.id);
            cleanup(extWs.id);
        }));
    });
});
exports.setupMediasoup = setupMediasoup;
// Create transport for WebRTC communication
function createTransport() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = yield router.createWebRtcTransport(mediasoup_config_1.webRtcTransportOptions);
        transport.on("dtlsstatechange", (dtlsState) => {
            if (dtlsState === "closed") {
                transport.close();
            }
        });
        return transport;
    });
}
// Connect WebRTC transport
function connectTransport(clientId, dtlsParameters) {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = transports.get(clientId);
        if (!transport) {
            throw new Error("Transport not found");
        }
        yield transport.connect({ dtlsParameters });
    });
}
// Create producer (audio/video track)
function createProducer(transport, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { kind, rtpParameters } = data;
        const producer = yield transport.produce({ kind, rtpParameters });
        return producer;
    });
}
// Create consumer (for receiving the track)
function createConsumer(transport, producer, rtpCapabilities) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
            throw new Error("Cannot consume this producer");
        }
        const consumer = yield transport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: false,
        });
        return consumer;
    });
}
// Switch between video and audio tracks
function switchTrack(clientId, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const producer = producers.get(clientId);
        if (producer) {
            if (action === "switchToAudio") {
                yield producer.pause();
            }
            else if (action === "switchToVideo") {
                yield producer.resume();
            }
        }
    });
}
// Start recording the call
function startRecordingCall(ws, sessionId, type) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("📽️ Starting call recording...");
            // Create recordings directory if it doesn't exist
            const recordingsDir = path.join(__dirname, '../recordings');
            yield fs.ensureDir(recordingsDir);
            // Generate unique filename
            const filename = `${(0, uuid_1.v4)()}.webm`;
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
            const recordingTransport = yield router.createPlainTransport({
                listenIp: { ip: '127.0.0.1', announcedIp: '127.0.0.1' },
                rtcpMux: true,
                comedia: true
            });
            const consumer = yield recordingTransport.consume({
                producerId: producer.id,
                rtpCapabilities: router.rtpCapabilities,
                paused: false
            });
            // Handle RTP packets
            consumer.on('rtp', (packet) => {
                writeStream.write(packet);
            });
            // Create database entry
            const recording = yield prisma.sessionRecording.create({
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
        }
        catch (error) {
            console.error("Error starting recording:", error);
            ws.send(JSON.stringify({
                action: "error",
                error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to start recording"
            }));
        }
    });
}
// Stop recording
function stopRecording(clientId) {
    return __awaiter(this, void 0, void 0, function* () {
        const recording = recordings.get(clientId);
        if (recording) {
            const { startTime, writeStream } = recording;
            // Calculate duration
            const duration = Math.floor((Date.now() - startTime) / 1000);
            // Close write stream
            writeStream.end();
            // Update database record with duration
            yield prisma.sessionRecording.updateMany({
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
    });
}
// Cleanup resources when client disconnects
function cleanup(clientId) {
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
class WebSocketServer extends ws_1.WebSocket.Server {
    constructor(options) {
        super(options);
    }
}
