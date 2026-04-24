import { BaseProjectError } from "./BaseProjectError";

export class LexicalError extends BaseProjectError {
  constructor(description: string, line: number, column: number) {
    super("Léxico", description, line, column);
  }
}
