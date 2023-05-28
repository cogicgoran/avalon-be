"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var socket_io_1 = require("socket.io");
var http_1 = __importDefault(require("http"));
var dotenv = __importStar(require("dotenv"));
var Game_1 = require("./game/Game");
dotenv.config();
var app = (0, express_1["default"])();
var server = http_1["default"].createServer(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
var gameIdCounter = 1;
var liveGames = new Map();
io.on("connection", function (socket) {
    //
    socket.on("createGame", function () {
        console.log("gameCreate?");
        var gameId = gameIdCounter++;
        var game = new Game_1.Game(gameId);
        game.addPlayer(socket.id);
        liveGames.set(gameId, game);
        socket.emit("gameCreated", game);
    });
    socket.on("joinGame", function (gameId) {
        console.log(gameId);
        var game = liveGames.get(gameId);
        if (!game) {
            socket.emit("error", { message: "Game not found." });
            return;
        }
        game.addPlayer(socket.id);
        socket.emit("gameJoined", game);
        io.emit("userJoinedGame", game);
    });
    socket.on("startGame", function (gameId) {
        try {
            var game = liveGames.get(gameId);
            if (!game)
                throw new Error("Game not found");
            game.start();
            io.emit("gameStarted", game);
        }
        catch (error) {
            socket.emit("gameStarted", undefined, error.message);
        }
    });
    // TODO: validate
    socket.on("choosePlayerForAdventure", function (gameId, selectedPlayers) {
        console.log('player for Adventure:', gameId, selectedPlayers);
        var game = liveGames.get(gameId);
        try {
            if (!game)
                throw new Error("Game not found");
            game.setAdventurePlayers(selectedPlayers);
            io.emit("adventurePlayersUpdated", game);
        }
        catch (error) { }
    });
    socket.on("toAdventureApprovalStep", function (gameId) {
        console.log('start adventure', gameId);
        var game = liveGames.get(gameId);
        try {
            if (!game)
                throw new Error("Game not found");
            game.startAdventure();
            io.emit("adventureApproval", undefined, game);
        }
        catch (error) {
            io.emit("adventureApproval", error === null || error === void 0 ? void 0 : error.message);
        }
    });
    socket.on('approveAdventureVote', function (gameId, player, adventureVoteApprove) {
        // validate arguments
        var game = liveGames.get(gameId);
        try {
            if (!game)
                throw new Error("Game not found");
            game.approveAdventureVote(player, adventureVoteApprove);
            io.emit('adventureApprovalEnd', undefined, game);
        }
        catch (error) {
            io.emit('adventureApprovalEnd', error.message);
        }
    });
    socket.on("adventureVote", function (gameId, player, vote) {
        var game = liveGames.get(gameId);
        console.log('[AdventureVote]:', gameId, player, vote);
        try {
            if (!game)
                throw new Error("Game not found");
            var adventureNumberBeforeMove = game.adventure;
            game.setPlayerVote(player, vote);
            if (game.adventure !== adventureNumberBeforeMove) {
                // All players have voted
                io.emit('adventureVoteUpdate', game);
                // TODO: handle
            }
            else {
                io.emit('adventureVoteUpdate', game);
            }
        }
        catch (error) { }
    });
    socket.on("disconnect", function () {
        //
    });
});
server.listen(parseInt(process.env.PORT));
