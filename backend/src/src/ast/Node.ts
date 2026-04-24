export abstract class Node {
  constructor(
    public readonly kind: string,
    public readonly line: number,
    public readonly column: number
  ) {}

  abstract label(): string;
  abstract children(): Array<Node | Node[] | null | undefined>;
}
