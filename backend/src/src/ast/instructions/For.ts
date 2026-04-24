import { Node } from "../Node";

export class ForInstruction extends Node {
  constructor(
    public readonly mode: "while" | "classic" | "range",
    public readonly initializer: Node | null,
    public readonly condition: Node | null,
    public readonly update: Node | null,
    public readonly rangeIndex: string | null,
    public readonly rangeValue: string | null,
    public readonly rangeSource: Node | null,
    public readonly body: Node[],
    line: number,
    column: number
  ) {
    super("For", line, column);
  }

  label(): string {
    return `For\\n${this.mode}`;
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.initializer, this.condition, this.update, this.rangeSource, this.body];
  }
}
