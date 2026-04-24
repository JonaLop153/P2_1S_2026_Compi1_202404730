import { Node } from "../Node";

export interface ElseIfBranch {
  condition: Node;
  body: Node[];
}

export class IfInstruction extends Node {
  constructor(
    public readonly condition: Node,
    public readonly thenBody: Node[],
    public readonly elseIfs: ElseIfBranch[],
    public readonly elseBody: Node[] | null,
    line: number,
    column: number
  ) {
    super("If", line, column);
  }

  label(): string {
    return "If";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.condition, this.thenBody, ...this.elseIfs.flatMap((branch) => [branch.condition, branch.body]), this.elseBody];
  }
}
