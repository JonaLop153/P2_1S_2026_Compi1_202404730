import { Node } from "../Node";

export class ReturnInstruction extends Node {
  constructor(
    public readonly expression: Node | null,
    line: number,
    column: number
  ) {
    super("Return", line, column);
  }

  label(): string {
    return "Return";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.expression];
  }
}
