import { Node } from "../Node";

export class ExpressionStatement extends Node {
  constructor(
    public readonly expression: Node,
    line: number,
    column: number
  ) {
    super("ExpressionStatement", line, column);
  }

  label(): string {
    return "ExprStmt";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.expression];
  }
}
