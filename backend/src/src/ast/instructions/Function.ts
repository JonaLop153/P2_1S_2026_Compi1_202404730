import { Node } from "../Node";

export interface ParameterNode {
  name: string;
  type: string;
}

export class FunctionInstruction extends Node {
  constructor(
    public readonly name: string,
    public readonly params: ParameterNode[],
    public readonly returnType: string | null,
    public readonly body: Node[],
    line: number,
    column: number
  ) {
    super("Function", line, column);
  }

  label(): string {
    return `Function\\n${this.name}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.body];
  }
}
