import http from 'http';
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
export const app = express();

export const PORT = parseInt(process.env.NODE_PORT!, 10) || 3000;
export const HOST = process.env.NODE_HOST || `http://localhost:${PORT}`;

app.use(cors());
app.use(json());
app.use('/', express.static('./public'));

export const server: http.Server = http.createServer(app);

export const start = () => {

  app.listen(PORT, () => {
    app.emit('started');
    console.log('Web server listening at port %s', PORT);
  });
};
