import { Node } from "../Node";

export class ContinueInstruction extends Node {
  constructor(line: number, column: number) {
    super("Continue", line, column);
  }

  label(): string {
    return "Continue";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [];
  }
}
