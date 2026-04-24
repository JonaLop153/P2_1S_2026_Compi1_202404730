import { BaseProjectError } from "../errors/BaseProjectError";

export class ErrorReport {
  static generate(errors: BaseProjectError[]): BaseProjectError[] {
    return errors;
  }
}
