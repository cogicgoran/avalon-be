import express from "express";
import { Server, Socket } from "socket.io";
import http from "http";
import * as dotenv from "dotenv";
import { Game } from "./game/Game";
import { IVote } from "./game/vote";
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

const liveSockets:Array<Socket> = []

const liveGames: Map<number, Game> = new Map();

io.on("connection", (socket) => {
  liveSockets.push(socket);
  socket.on("createGame", () => {
    console.log("gameCreate?");
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
    socket.emit("gameJoined", game);
    io.emit("userJoinedGame", game);
  });

  socket.on("startGame", (gameId: unknown) => {
    try {
      const game = liveGames.get(gameId as any);
      if (!game) throw new Error("Game not found");

      game.start();
      io.emit("gameStarted", game);
    } catch (error: any) {
      socket.emit("gameStarted", undefined, error.message);
    }
  });

  // TODO: validate
  socket.on(
    "choosePlayerForAdventure",
    (gameId: unknown, selectedPlayers: Array<unknown>) => {
      console.log('player for Adventure:', gameId, selectedPlayers);
      const game = liveGames.get(gameId as any);
      try {
        if (!game) throw new Error("Game not found");
        game.setAdventurePlayers(selectedPlayers as Array<string>);
        io.emit("adventurePlayersUpdated", game);
      } catch (error) {}
    }
  );

  socket.on("toAdventureApprovalStep", (gameId: unknown) => {
    console.log('start adventure', gameId)
    const game = liveGames.get(gameId as any);
    try {
      if (!game) throw new Error("Game not found");
      game.startAdventure();
      io.emit("adventureApproval", undefined, game);
    } catch (error: any) {
      io.emit("adventureApproval", error?.message);
    }
  });

  socket.on('approveAdventureVote',(gameId: unknown, player:string, adventureVoteApprove: boolean) => {
    // validate arguments
    const game = liveGames.get(gameId as any);
    try {
      if (!game) throw new Error("Game not found");
      game.approveAdventureVote(player, adventureVoteApprove);
      io.emit('adventureApprovalEnd', undefined, game)
    } catch (error: any) {
      io.emit('adventureApprovalEnd', error.message, game)
    }
  })

  socket.on("adventureVote", (gameId: unknown, player: string, vote: IVote) => {
    const game = liveGames.get(gameId as any);
    console.log('[AdventureVote]:', gameId, player, vote);
    try {
      if (!game) throw new Error("Game not found");
      const adventureNumberBeforeMove = game.adventure;
      game.setPlayerVote(player, vote);

      if(game.adventure !== adventureNumberBeforeMove) {
        // All players have voted
        io.emit('adventureVoteUpdate', game)
        // TODO: handle
      } else {
        io.emit('adventureVoteUpdate', game)
      }
    } catch (error) {}
  });

  socket.on("disconnect", () => {
    //
  });
});

server.listen(parseInt(process.env.PORT!));
