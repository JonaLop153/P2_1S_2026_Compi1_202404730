import { Node } from "../Node";

export class Logical extends Node {
  constructor(
    public readonly operator: string,
    public readonly left: Node,
    public readonly right: Node | null,
    line: number,
    column: number
  ) {
    super("Logical", line, column);
  }

  label(): string {
    return `Logical\\n${this.operator}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.left, this.right];
  }
}
