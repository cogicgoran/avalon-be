import express from "express";
import { Server } from "socket.io";
import http from "http";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  //

  socket.on("disconnect", () => {
    //
  });
});

server.listen(parseInt(process.env.PORT!));
