import { Node } from "../Node";

export interface StructFieldValue {
  name: string;
  expression: Node;
}

export class StructLiteral extends Node {
  constructor(
    public readonly structName: string,
    public readonly fields: StructFieldValue[],
    line: number,
    column: number
  ) {
    super("StructLiteral", line, column);
  }

  label(): string {
    return `StructLiteral\\n${this.structName}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.fields.map((item) => item.expression)];
  }
}
