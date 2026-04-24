import { Node } from "../Node";

export type AccessPart =
  | { kind: "index"; expression: Node }
  | { kind: "property"; name: string };

export class Access extends Node {
  constructor(
    public readonly target: Node,
    public readonly parts: AccessPart[],
    line: number,
    column: number
  ) {
    super("Access", line, column);
  }

  label(): string {
    return "Access";
  }

  children(): Array<Node | Node[] | null | undefined> {
    return [this.target, ...this.parts.map((part) => (part.kind === "index" ? part.expression : null))];
  }
}
