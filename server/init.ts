import http from 'http';
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
export const app = express();

app.use(cors());
app.use(json());

export const server: http.Server = http.createServer(app);

export const start = () => {
  const port = parseInt(process.env.NODE_PORT!, 10) || 3000;

  app.listen(port, () => {
    app.emit('started');
    console.log('Web server listening at port %s', port);
  });
};
