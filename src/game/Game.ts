import {
  Assassin,
  ICharacterRole,
  Merlin,
  Mordred,
  Morgana,
  Oberon,
  Peasant,
  Percival,
} from "./characters";

interface PlayerWithRole {
  player: unknown;
  role: ICharacterRole;
}

export class Game {
  static minPlayerLenght = 5; // TODO: Check business logic
  static maxPlayerLength = 10; // TODO: Check business logic
  id: number;
  isOberonAllowed: boolean = false;
  round = 1;
  hasGameStarted = false;
  roundHistory: Array<unknown> = []; // {roundNumber: 1, outcome: 'Success' | 'Fail'}
  players: Array<string> = [];
  roles: Array<ICharacterRole> = [];
  playersWithRoles: Array<PlayerWithRole> = [];
  nextMove: unknown;

  constructor(gameId: number) {
    this.id = gameId;
  }

  start() {
    if (this.players.length < Game.minPlayerLenght) {
      throw new Error(`Minimum amount of players: ${Game.minPlayerLenght}`);
    }
    if (this.players.length > Game.maxPlayerLength) {
      throw new Error(`Maximum amount of players: ${Game.maxPlayerLength}`);
    }

    this.assignPlayerRoles();
    this.hasGameStarted = true;
    this.nextMove = {
      step: "vote",
      player: this.players[0],
      votes: this.getRoundAdventureVotes(),
    };
  }

  private getRoundAdventureVotes(): number {
    const playerRoundAdventureMap: Map<number, Map<number, number>> = new Map();
    playerRoundAdventureMap.set(5, new Map().set(1, 2).set(2, 3).set(3, 2).set(4, 3).set(5, 3));
    playerRoundAdventureMap.set(6, new Map().set(1, 2).set(2, 3).set(3, 4).set(4, 3).set(5, 4));
    playerRoundAdventureMap.set(7, new Map().set(1, 2).set(2, 3).set(3, 3).set(4, 4).set(5, 4));
    playerRoundAdventureMap.set(8, new Map().set(1, 3).set(2, 4).set(3, 4).set(4, 5).set(5, 5));
    playerRoundAdventureMap.set(9, new Map().set(1, 3).set(2, 4).set(3, 4).set(4, 5).set(5, 5));
    playerRoundAdventureMap.set(10, new Map().set(1, 3).set(2, 4).set(3, 4).set(4, 5).set(5, 5));

    return playerRoundAdventureMap.get(this.players.length)?.get(this.round)!;
  }

  addPlayer(player: string) {
    this.players.push(player);
  }

  private nextRound() {
    this.round = this.round + 1;
  }

  private assignPlayerRoles() {
    const roles = this.getGameRoles(this.players.length);
    // TODO: Shuffle players or roles
    const playersWithRoles: Array<PlayerWithRole> = [];
    this.players.forEach((player, index) => {
      playersWithRoles.push({
        player: player,
        role: roles[index],
      });
    });

    this.playersWithRoles = playersWithRoles;
    this.roles = roles;
  }

  private getGameRoles(numOfPlayers: number): Array<ICharacterRole> {
    const gameRoles = [
      new Merlin(),
      new Percival(),
      new Peasant(),
      new Mordred(),
      new Morgana(),
    ];
    switch (numOfPlayers) {
      case 5:
        return gameRoles;
      case 6:
        gameRoles.push(new Peasant());
        return gameRoles;
      case 7:
        if (this.isOberonAllowed) {
          gameRoles.push(new Oberon());
        } else {
          gameRoles.push(new Assassin());
        }
        return gameRoles;
      case 8:
        gameRoles.push(new Peasant());
        return gameRoles;
      case 9:
        gameRoles.push(new Peasant());
        return gameRoles;
      case 10:
        gameRoles.push(new Assassin());
        return gameRoles;
    }
    throw new Error("Invalid logic exception");
  }
}
