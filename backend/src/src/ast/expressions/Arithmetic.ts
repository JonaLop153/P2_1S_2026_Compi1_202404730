import { Node } from "../Node";

export class Arithmetic extends Node {
  constructor(
    public readonly operator: string,
    public readonly left: Node,
    public readonly right: Node | null,
    line: number,
    column: number
  ) {
    super("Arithmetic", line, column);
  }

  label(): string {
    return `Arithmetic\\n${this.operator}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.left, this.right];
  }
}
