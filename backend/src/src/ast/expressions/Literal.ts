import { Node } from "../Node";

export class Literal extends Node {
  constructor(
    public readonly valueType: string,
    public readonly value: unknown,
    line: number,
    column: number
  ) {
    super("Literal", line, column);
  }

  label(): string {
    return `Literal\\n${this.valueType}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [];
  }
}
