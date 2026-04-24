import { BaseProjectError } from "./BaseProjectError";

export class ErrorList {
  private readonly items: BaseProjectError[] = [];

  add(error: BaseProjectError): void {
    this.items.push(error);
  }

  all(): BaseProjectError[] {
    return [...this.items];
  }

  hasErrors(): boolean {
    return this.items.length > 0;
  }

  clear(): void {
    this.items.length = 0;
  }
}
