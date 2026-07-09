import { io, Socket } from 'socket.io-client';
import { storage } from '../utils/storage';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (): Socket => {
  if (socket?.connected) return socket;

  const token = storage.getAccessToken();
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const startTrackingDonor = (requestId: number): void => {
  const s = getSocket() || connectSocket();
  s.emit('track:start', { requestId });
};

export const updateDonorLocation = (latitude: number, longitude: number): void => {
  const s = getSocket();
  if (s) {
    s.emit('track:location', { latitude, longitude });
  }
};

export const watchDonors = (requestId: number): void => {
  const s = getSocket() || connectSocket();
  s.emit('track:watch', { requestId });
};

export const requestDonorRoute = (
  donorLat: number,
  donorLng: number,
  hospitalLat: number,
  hospitalLng: number
): void => {
  const s = getSocket();
  if (s) {
    s.emit('track:route', { donorLat, donorLng, hospitalLat, hospitalLng });
  }
};

// ── Real-Time Donor Live Tracking ──────────────────────────────

export const sendLiveLocation = (
  latitude: number,
  longitude: number,
  heading: number | null,
  speed: number | null,
  accuracy: number | null
): void => {
  const s = getSocket();
  if (s) {
    s.emit('location:update', { latitude, longitude, heading, speed, accuracy });
  }
};
