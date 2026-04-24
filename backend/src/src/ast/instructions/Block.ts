import { Node } from "../Node";

export class BlockInstruction extends Node {
  constructor(
    public readonly body: Node[],
    line: number,
    column: number
  ) {
    super("Block", line, column);
  }

  label(): string {
    return "Block";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.body];
  }
}
