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
import { STEP_NAME } from "./steps";
import { IVote } from "./vote";

interface PlayerWithRole {
  player: string;
  role: ICharacterRole;
  teammates: Array<string>;
  unsorted: Array<string>;
  enemies: Array<string>;
}

interface IMoveAdventure {
  step: "adventureApprovalVoting";
  votes: [{ player: string; agree: boolean }];
}

interface IAdventurePlayerVote {
  step: "chooseAdventurePlayers";
  player: string;
  votes: number;
}

export enum RoundOutcome {
  Success,
  Fail,
  Incomplete,
}

const INITIAL_ROUND = 1;
const INITIAL_ADVENTURE = 1;

export class Game {
  static minPlayerLenght = 5;
  static maxPlayerLength = 10;
  id: number;
  isOberonAllowed: boolean = false;
  adventure!: number;
  isGameInProgress = false;
  lobbyLeader!: string;
  adventureHistory: Array<RoundOutcome> = new Array(5).fill(
    RoundOutcome.Incomplete
  );
  players: Array<string> = [];
  roles: Array<ICharacterRole> = [];
  playersWithRoles: Array<PlayerWithRole> = [];
  selectedAdventurePlayers: Array<string> = [];
  nextMove: any | null = null;
  adventureVotes: Map<string, IVote> = new Map(); // TODO: dont send over network to cs
  currentRoundPlayer!: string;
  adventureApprovalVotes: Map<string, boolean> = new Map();
  currentRound!: number; // adventure has at most 5 rounds

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

    this.adventureHistory = [];
    this.assignPlayerRoles();
    this.isGameInProgress = true;
    this.currentRoundPlayer = this.players[0];
    this.currentRound = INITIAL_ROUND;
    this.adventure = INITIAL_ADVENTURE;
    this.nextMove = {
      step: STEP_NAME.ChooseAdventurePlayers,
      player: this.currentRoundPlayer,
      votes: this.getNumberOfAdventurers(),
    };
  }

  isTwoVoteFailRequired() {
    return this.adventure === 4 && this.players.length >= 7;
  }

  isAdventureVoteComplete() {
    console.log(this.adventureVotes);
    return this.adventureVotes.size === this.getNumberOfAdventurers();
  }

  getRoundOutcome(): {
    outcome: RoundOutcome;
    numOfSuccess: number;
    numOfFail: number;
  } {
    let isFail!: boolean;
    let numOfFail = 0;
    this.adventureVotes.forEach((vote) => {
      if (vote === "fail") numOfFail++;
    });
    if (this.isTwoVoteFailRequired()) {
      isFail = numOfFail >= 2;
    } else {
      isFail = numOfFail >= 1;
    }
    return {
      outcome: isFail ? RoundOutcome.Fail : RoundOutcome.Success,
      numOfSuccess: this.players.length - numOfFail,
      numOfFail,
    };
  }

  getAdventureFailCount() {
    return this.adventureHistory.filter(
      (outcome) => outcome === RoundOutcome.Fail
    ).length;
  }

  private endGame() {
    // this.winner = '';
    this.nextMove = { step: STEP_NAME.GameOver };
    this.isGameInProgress = false;
  }

  onPlayerVote() {
    if (this.isAdventureVoteComplete()) {
      this.adventureHistory[this.adventure - 1] =
        this.getRoundOutcome().outcome;
      this.adventure++;
      this.currentRoundPlayer = this.getNextPlayer();
      this.selectedAdventurePlayers = [];
      this.adventureVotes.clear();
      if (this.getAdventureFailCount() === 3) {
        this.endGame();
      } else {
        this.nextMove = {
          step: STEP_NAME.ChooseAdventurePlayers,
          player: this.currentRoundPlayer,
          votes: this.getNumberOfAdventurers(),
        };
      }
    }
  }

  getNextPlayer() {
    const length = this.players.length;
    const currentPlayerIndex = this.players.findIndex(
      (player) => player === this.currentRoundPlayer
    );
    return this.players[(currentPlayerIndex + 1) % length];
  }

  setPlayerVote(player: string, vote: IVote) {
    if (this.adventureVotes.has(player)) return;
    this.adventureVotes.set(player, vote);
    this.onPlayerVote();
  }

  private getNumberOfAdventurers(): number {
    const playerRoundAdventureMap: Map<number, Map<number, number>> = new Map();
    playerRoundAdventureMap.set(
      5,
      new Map().set(1, 2).set(2, 3).set(3, 2).set(4, 3).set(5, 3)
    );
    playerRoundAdventureMap.set(
      6,
      new Map().set(1, 2).set(2, 3).set(3, 4).set(4, 3).set(5, 4)
    );
    playerRoundAdventureMap.set(
      7,
      new Map().set(1, 2).set(2, 3).set(3, 3).set(4, 4).set(5, 4)
    );
    playerRoundAdventureMap.set(
      8,
      new Map().set(1, 3).set(2, 4).set(3, 4).set(4, 5).set(5, 5)
    );
    playerRoundAdventureMap.set(
      9,
      new Map().set(1, 3).set(2, 4).set(3, 4).set(4, 5).set(5, 5)
    );
    playerRoundAdventureMap.set(
      10,
      new Map().set(1, 3).set(2, 4).set(3, 4).set(4, 5).set(5, 5)
    );

    return playerRoundAdventureMap
      .get(this.players.length)
      ?.get(this.adventure)!;
  }

  addPlayer(player: string) {
    if (!this.lobbyLeader) this.lobbyLeader = player;
    this.players.push(player);
  }

  setAdventurePlayers(selectedAdventurePlayers: Array<string>) {
    this.selectedAdventurePlayers = selectedAdventurePlayers;
  }

  private isAdventureStartValid() {
    return (
      this.selectedAdventurePlayers.length === this.getNumberOfAdventurers()
    );
  }

  startAdventure() {
    if (!this.isAdventureStartValid())
      throw new Error(
        `${this.getNumberOfAdventurers()} must be selected for this adventure`
      );
    this.goToNextMove();
  }

  approveAdventureVote(player: string, voteApprove: boolean) {
    console.log("[Player voting]:", player, voteApprove);
    if (this.adventureApprovalVotes.has(player))
      throw new Error("Player already voted");
    const playersThatVote = this.players;
    console.log(playersThatVote);
    if (!playersThatVote.includes(player))
      throw new Error("Action not allowed");
    console.log("vote successfull");
    this.adventureApprovalVotes.set(player, voteApprove);
    this.onAdventureApprovalVote();
  }

  handleAdventureApprovalVotingEnd() {
    let playersAgainst: number = 0;
    let playersFor: number = 0;
    this.adventureApprovalVotes.forEach((vote) => {
      vote ? playersFor++ : playersAgainst++;
    });
    if (playersFor > playersAgainst) {
      this.goToNextMove();
    } else {
      this.nextRound();
    }
  }

  onAdventureApprovalVote() {
    if (this.adventureApprovalVotes.size === this.players.length) {
      this.handleAdventureApprovalVotingEnd();
    } else {
      // handle case
    }
  }

  private goToNextMove() {
    this.adventureApprovalVotes.clear();
    if (this.currentRound === 5) {
      this.nextMove = {
        step: STEP_NAME.AdventureOutcomeVoting,
        votes: [],
      };
      return;
    }
    if (this.nextMove.step === STEP_NAME.ChooseAdventurePlayers) {
      this.nextMove = {
        step: STEP_NAME.AdventureApproval,
        votes: [],
      };
      return;
    }
    if (this.nextMove.step === STEP_NAME.AdventureApproval) {
      this.nextMove = {
        step: STEP_NAME.AdventureOutcomeVoting,
        votes: [],
      };
      return;
    }
  }

  private nextRound() {
    this.adventureApprovalVotes.clear();
    this.selectedAdventurePlayers = [];
    this.currentRoundPlayer = this.getNextPlayer();
    this.currentRound++;
    this.nextMove = {
      step: STEP_NAME.ChooseAdventurePlayers,
      player: this.currentRoundPlayer,
      votes: this.getNumberOfAdventurers(),
    };
    // this.adventure = this.adventure + 1;
  }

  private nextAdventure() {
    this.adventure = this.adventure + 1;
    this.currentRound = 1;
  }

  private assignPlayerRoles() {
    const roles = this.getGameRoles(this.players.length);
    shuffle(roles);
    const playersWithRoles: Array<PlayerWithRole> = [];
    this.players.forEach((player, index) => {
      playersWithRoles.push({
        player: player,
        role: roles[index],
        enemies: [],
        teammates: [],
        unsorted: [],
      });
    });

    
    this.playersWithRoles = playersWithRoles;
    this.updateSpecialRoles();
    this.roles = roles;
  }

  private updateSpecialRoles() {
    const morganaPlayer = this.playersWithRoles.find(
      (playerWithRole) => playerWithRole.role.name === new Morgana().name
    )!;
    const merlinPlayer = this.playersWithRoles.find(
      (playerWithRole) => playerWithRole.role.name === new Merlin().name
    )!;
    const percivalPlayer = this.playersWithRoles.find(
      (playerWithRole) => playerWithRole.role.name === new Percival().name
    )!;
    const evilPlayers = this.playersWithRoles.filter(
      (playerWithRole) => playerWithRole.role.team === "evil"
    )!;
    merlinPlayer.enemies = evilPlayers
      .filter((evilPlayer) => evilPlayer.role.name !== new Mordred().name)
      .map((playerWithRole) => playerWithRole.player);
    percivalPlayer.unsorted = [morganaPlayer?.player, merlinPlayer?.player];
    evilPlayers.forEach((evilPlayer) => {
      evilPlayer.teammates = [];
      if (evilPlayer.role.name === new Oberon().name) return;
      evilPlayers.forEach((evilPlayerInner) => {
        evilPlayer.teammates.push(evilPlayerInner.player);
      });
    });
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

// https://bost.ocks.org/mike/shuffle/
function shuffle(array: Array<unknown>) {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}
