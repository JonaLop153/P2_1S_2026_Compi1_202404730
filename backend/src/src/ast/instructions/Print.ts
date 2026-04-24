import { Node } from "../Node";

export class PrintInstruction extends Node {
  constructor(
    public readonly args: Node[],
    line: number,
    column: number
  ) {
    super("Print", line, column);
  }

  label(): string {
    return "Print";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.args];
  }
}
