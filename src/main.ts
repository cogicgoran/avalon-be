import express from "express";
import { Server } from "socket.io";
import http from "http";
import * as dotenv from "dotenv";
import { Game } from "./game/Game";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let gameIdCounter = 1;

const liveGames: Map<number, Game> = new Map();

io.on("connection", (socket) => {
  //
  socket.on("createGame", () => {
    console.log('gameCreate?')
    const gameId = gameIdCounter++;
    const game = new Game(gameId);
    game.addPlayer(socket.id);
    liveGames.set(gameId, game);
    socket.emit("gameCreated", game);
  });

  socket.on("joinGame", (gameId) => {
    console.log(gameId);
    const game = liveGames.get(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found." });
      return;
    }
    game.addPlayer(socket.id);
    socket.emit('gameJoined', game);
    io.emit('userJoinedGame', game);
  });

  socket.on('startGame',(gameId: unknown) => {
    console.log(gameId);
    try {
      const game = liveGames.get(gameId as any);
      if(!game) 
        throw new Error('Game not found');
      
      game.start()
      io.emit('gameStarted', game);
      
    } catch (error: any) {
      socket.emit('gameStarted',undefined, error.message)
    }

  });


  socket.on("disconnect", () => {
    //
  });
});

server.listen(parseInt(process.env.PORT!));
