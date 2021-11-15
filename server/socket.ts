import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
export type Client = WebSocket & { data: any };

export const create = (config: { server: http.Server } | { port: number }) => {

  console.log("INITING SOCKET SERVER");

  const server = Object.assign(new WebSocketServer(config), {

    handlers: [] as ({ predicate: (msg: any) => boolean, handler: (client: Client, msg: any) => any })[],

    connectHandlers: [] as ((client: Client) => any)[],

    isReady(client: Client) {
      return client.readyState === WebSocket.OPEN;
    },

    broadcast(msg: any) {
      (this as any).clients.forEach((client: Client) => {
        this.send(client, msg);
      });
    },

    send(client: Client, msg: any) {
      if (this.isReady(client)) {
        client.send(JSON.stringify(msg));
      }
    },

    onConnect(handler: (client: Client) => any) {
      this.connectHandlers.push(handler);
    },

    listen(predicate: (msg: any) => boolean, handler: (client: Client, msg: any) => any) {
      this.handlers.push({ predicate, handler });
    }
  });

  server.on('connection', (client: Client) => {

    client.data = {};

    server.connectHandlers.forEach(handler => handler(client));

    /**
     * Handle dispatching incoming client messages to listeners
     */
    client.on('message', (msg: WebSocket.Data) => {
      /**
       * @TODO Add decoder for incoming messages
       */
      const data = JSON.parse(msg.toString());
      server.handlers.forEach(({ predicate, handler }) => predicate(data) && handler(client, data))
    });
  });

  return server;
};
