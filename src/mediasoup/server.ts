import * as mediasoup from 'mediasoup';

export let mediasoupWorker: mediasoup.types.Worker;
export let mediasoupRouter: mediasoup.types.Router;

// Mediasoup configuration
const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
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

const webRtcTransportOptions: mediasoup.types.WebRtcTransportOptions = {
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

export async function initializeMediasoup() {
  try {
    // Create worker
    mediasoupWorker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '40000'),
      rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '49999'),
    });

    mediasoupWorker.on('died', (error) => {
      console.error('Mediasoup worker died:', error);
      setTimeout(() => process.exit(1), 2000);
    });

    // Create router
    mediasoupRouter = await mediasoupWorker.createRouter({
      mediaCodecs,
    });

    console.info('Mediasoup worker and router created successfully');
  } catch (error) {
    console.error('Failed to initialize Mediasoup:', error);
    throw error;
  }
}

export async function createWebRtcTransport() {
  try {
    const transport = await mediasoupRouter.createWebRtcTransport(webRtcTransportOptions);

    transport.on('dtlsstatechange', (dtlsState: mediasoup.types.DtlsState) => {
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
  } catch (error) {
    console.error('Failed to create WebRTC transport:', error);
    throw error;
  }
}

export function getRouterRtpCapabilities() {
  return mediasoupRouter.rtpCapabilities;
}