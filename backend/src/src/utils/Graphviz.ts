import { Node } from "../ast/Node";

export class Graphviz {
  static build(nodes: Node[]): string {
    let count = 0;
    const lines: string[] = ["digraph AST {", "node [shape=box];"];

    const walk = (node: Node): string => {
      const current = `n${count++}`;
      lines.push(`${current} [label="${node.label()}"];`);
      for (const child of node.children()) {
        if (!child) continue;
        if (Array.isArray(child)) {
          for (const inner of child) {
            const childId = walk(inner);
            lines.push(`${current} -> ${childId};`);
          }
        } else {
          const childId = walk(child);
          lines.push(`${current} -> ${childId};`);
        }
      }
      return current;
    };

    const root = `n${count++}`;
    lines.push(`${root} [label="Program"];`);
    for (const node of nodes) {
      const childId = walk(node);
      lines.push(`${root} -> ${childId};`);
    }
    lines.push("}");
    return lines.join("\n");
  }
}
