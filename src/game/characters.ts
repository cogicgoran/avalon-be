const TEAM = {
  Good: "good",
  Evil: "evil",
} as const;

export interface ICharacterRole {
  team: (typeof TEAM)[keyof typeof TEAM];
  name: string;

}

export class Merlin implements ICharacterRole {
  team = TEAM.Good;
  name = "Merlin";
}

export class Percival implements ICharacterRole {
  team = TEAM.Good;
  name = "Percival";
}

export class Peasant implements ICharacterRole {
  team = TEAM.Good;
  name = "Peasant";
}

export class Mordred implements ICharacterRole {
  team = TEAM.Evil;
  name = "Mordred";
}

export class Morgana implements ICharacterRole {
  team = TEAM.Evil;
  name = "Morgana";
}

export class Oberon implements ICharacterRole {
  team = TEAM.Evil;
  name = "Percival";
}

export class Assassin implements ICharacterRole {
  team = TEAM.Evil;
  name = "Assassin";
}
