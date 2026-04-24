import { Node } from "../Node";

export interface StructField {
  type: string;
  name: string;
}

export class StructInstruction extends Node {
  constructor(
    public readonly name: string,
    public readonly fields: StructField[],
    line: number,
    column: number
  ) {
    super("Struct", line, column);
  }

  label(): string {
    return `Struct\\n${this.name}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [];
  }
}
