import { BaseProjectError } from "./BaseProjectError";

export class SyntaxError extends BaseProjectError {
  constructor(description: string, line: number, column: number) {
    super("Sintáctico", description, line, column);
  }
}
