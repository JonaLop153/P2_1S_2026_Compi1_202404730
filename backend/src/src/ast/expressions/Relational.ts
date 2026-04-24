import { Node } from "../Node";

export class Relational extends Node {
  constructor(
    public readonly operator: string,
    public readonly left: Node,
    public readonly right: Node,
    line: number,
    column: number
  ) {
    super("Relational", line, column);
  }

  label(): string {
    return `Relational\\n${this.operator}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.left, this.right];
  }
}
