import { Node } from "../Node";

export class Assignment extends Node {
  constructor(
    public readonly target: Node,
    public readonly operator: string,
    public readonly expression: Node,
    line: number,
    column: number
  ) {
    super("Assignment", line, column);
  }

  label(): string {
    return `Assignment\\n${this.operator}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.target, this.expression];
  }
}
