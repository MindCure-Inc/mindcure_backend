"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webRtcTransportOptions = exports.mediaCodecs = void 0;
exports.setupMediasoupWorker = setupMediasoupWorker;
exports.getMediasoupRouter = getMediasoupRouter;
exports.createWebRtcTransport = createWebRtcTransport;
exports.addProducer = addProducer;
exports.addConsumer = addConsumer;
// Media codecs configuration
exports.mediaCodecs = [
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
        mimeType: 'video/H264',
        clockRate: 90000,
        parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
        },
    },
];
// WebRTC transport options
exports.webRtcTransportOptions = {
    listenIps: [
        {
            ip: '0.0.0.0',
            announcedIp: '0.0.0.0', // Change to your public IP or domain in production
        },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
};
function setupMediasoupWorker() {
    // TODO: Implement worker setup
}
function getMediasoupRouter() {
    // TODO: Implement router getter
}
function createWebRtcTransport() {
    // TODO: Implement transport creation
}
function addProducer() {
    // TODO: Implement producer addition
}
function addConsumer() {
    // TODO: Implement consumer addition
}
