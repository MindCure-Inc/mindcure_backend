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
exports.mediasoupRouter = exports.mediasoupWorker = void 0;
exports.initializeMediasoup = initializeMediasoup;
exports.createWebRtcTransport = createWebRtcTransport;
exports.getRouterRtpCapabilities = getRouterRtpCapabilities;
const mediasoup = __importStar(require("mediasoup"));
// Mediasoup configuration
const mediaCodecs = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000,
        },
    },
    {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
            'profile-id': 2,
            'x-google-start-bitrate': 1000,
        },
    },
    {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
            'packetization-mode': 1,
            'profile-level-id': '4d0032',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000,
        },
    },
];
const webRtcTransportOptions = {
    listenIps: [
        {
            ip: process.env.MEDIASOUP_LISTEN_IP || '127.0.0.1',
            announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
        },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
};
function initializeMediasoup() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create worker
            exports.mediasoupWorker = yield mediasoup.createWorker({
                logLevel: 'warn',
                rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '40000'),
                rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '49999'),
            });
            exports.mediasoupWorker.on('died', (error) => {
                console.error('Mediasoup worker died:', error);
                setTimeout(() => process.exit(1), 2000);
            });
            // Create router
            exports.mediasoupRouter = yield exports.mediasoupWorker.createRouter({
                mediaCodecs,
            });
            console.info('Mediasoup worker and router created successfully');
        }
        catch (error) {
            console.error('Failed to initialize Mediasoup:', error);
            throw error;
        }
    });
}
function createWebRtcTransport() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transport = yield exports.mediasoupRouter.createWebRtcTransport(webRtcTransportOptions);
            transport.on('dtlsstatechange', (dtlsState) => {
                if (dtlsState === 'closed') {
                    transport.close();
                }
            });
            transport.on('@close', () => {
                console.info('WebRTC transport closed');
            });
            return {
                transport,
                params: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                },
            };
        }
        catch (error) {
            console.error('Failed to create WebRTC transport:', error);
            throw error;
        }
    });
}
function getRouterRtpCapabilities() {
    return exports.mediasoupRouter.rtpCapabilities;
}
