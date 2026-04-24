import { Node } from "../Node";

export class Identifier extends Node {
  constructor(
    public readonly name: string,
    line: number,
    column: number
  ) {
    super("Identifier", line, column);
  }

  label(): string {
    return `Id\\n${this.name}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [];
  }
}
