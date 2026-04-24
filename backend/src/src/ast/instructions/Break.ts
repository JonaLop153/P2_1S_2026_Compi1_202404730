import { Node } from "../Node";

export class BreakInstruction extends Node {
  constructor(line: number, column: number) {
    super("Break", line, column);
  }

  label(): string {
    return "Break";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [];
  }
}
