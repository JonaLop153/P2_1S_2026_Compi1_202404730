export class BaseProjectError extends Error {
  constructor(
    public readonly kind: string,
    public readonly description: string,
    public readonly line: number,
    public readonly column: number
  ) {
    super(description);
  }
}
