import dotenv from 'dotenv';
import http from "http";
import app from './app';
import { setupMediasoup } from "./mediasoupServer";

dotenv.config();

const port = process.env.PORT || 3000;

const server = http.createServer(app);

setupMediasoup(server)
  .then(() => {
    server.listen(port, () => {
      console.log(`🚀 MindCure + MediaSoup running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("💥 Failed to setup MediaSoup:", err);
  });
