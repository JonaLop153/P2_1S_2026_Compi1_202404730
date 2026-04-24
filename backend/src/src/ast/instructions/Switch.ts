import { Node } from "../Node";

export interface SwitchCase {
  match: Node;
  body: Node[];
}

export class SwitchInstruction extends Node {
  constructor(
    public readonly expression: Node,
    public readonly cases: SwitchCase[],
    public readonly defaultBody: Node[] | null,
    line: number,
    column: number
  ) {
    super("Switch", line, column);
  }

  label(): string {
    return "Switch";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.expression, ...this.cases.flatMap((item) => [item.match, item.body]), this.defaultBody];
  }
}
