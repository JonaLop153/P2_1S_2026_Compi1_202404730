import { Node } from "../Node";

export class SliceLiteral extends Node {
  constructor(
    public readonly valueType: string,
    public readonly values: Node[],
    line: number,
    column: number
  ) {
    super("SliceLiteral", line, column);
  }

  label(): string {
    return `Slice\\n${this.valueType}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.values];
  }
}
