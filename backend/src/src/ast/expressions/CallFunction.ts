import { Node } from "../Node";

export class CallFunction extends Node {
  constructor(
    public readonly callee: string,
    public readonly args: Node[],
    line: number,
    column: number
  ) {
    super("CallFunction", line, column);
  }

  label(): string {
    return `Call\\n${this.callee}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.args];
  }
}
