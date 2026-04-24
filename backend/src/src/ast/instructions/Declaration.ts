import { Node } from "../Node";

export class Declaration extends Node {
  constructor(
    public readonly name: string,
    public readonly declaredType: string | null,
    public readonly expression: Node | null,
    public readonly mode: "var" | "infer" | "typed",
    line: number,
    column: number
  ) {
    super("Declaration", line, column);
  }

  label(): string {
    return `Declaration\\n${this.name}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.expression];
  }
}
