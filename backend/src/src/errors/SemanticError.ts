import { BaseProjectError } from "./BaseProjectError";

export class SemanticError extends BaseProjectError {
  constructor(description: string, line: number, column: number) {
    super("Semántico", description, line, column);
  }
}
