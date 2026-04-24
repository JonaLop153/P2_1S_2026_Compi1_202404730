const editor = document.getElementById("editor");
const currentFile = document.getElementById("currentFile");
const cursorInfo = document.getElementById("cursorInfo");
const consolePanel = document.getElementById("console");
const errorsPanel = document.getElementById("errors");
const symbolsPanel = document.getElementById("symbols");
const astPanel = document.getElementById("ast");

let fileName = "sin_nombre.gst";

document.getElementById("newFile").addEventListener("click", () => {
  editor.value = "";
  fileName = "sin_nombre.gst";
  currentFile.textContent = fileName;
  clearPanels();
});

document.getElementById("openFile").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  fileName = file.name;
  currentFile.textContent = fileName;
  editor.value = await file.text();
  clearPanels();
});

document.getElementById("saveFile").addEventListener("click", () => {
  const blob = new Blob([editor.value], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName.endsWith(".gst") ? fileName : `${fileName}.gst`;
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById("runCode").addEventListener("click", async () => {
  consolePanel.textContent = "Ejecutando...";
  try {
    const response = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: editor.value })
    });
    const data = await response.json();

    // Console
    consolePanel.textContent = (data.console || []).join("\n") || "(sin salida)";

    // Errors
    const errs = data.errors || [];
    errorsPanel.innerHTML = errs.length
      ? renderTable(errs, ["kind", "description", "line", "column"])
      : "<p class='empty'>Sin errores.</p>";

    // Symbols
    const syms = data.symbols || [];
    symbolsPanel.innerHTML = syms.length
      ? renderTable(syms, ["id", "symbolType", "dataType", "scope", "line", "column"])
      : "<p class='empty'>Sin símbolos.</p>";

    // AST
    astPanel.textContent = data.astDot || "";

    // Auto-switch to errors tab if there are errors
    if (errs.length) switchTab("errors");

  } catch (error) {
    consolePanel.textContent = `❌ No se pudo conectar con el backend.\nAsegúrate de que el servidor esté corriendo en http://localhost:3000\n\nError: ${error.message}`;
    switchTab("console");
  }
});

editor.addEventListener("keyup", updateCursor);
editor.addEventListener("click", updateCursor);
editor.addEventListener("keydown", (e) => {
  // Tab inserts 2 spaces
  if (e.key === "Tab") {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + "  " + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.target));
});

function switchTab(target) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.target === target));
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.toggle("active", c.id === target));
}

function updateCursor() {
  const position = editor.selectionStart;
  const line = editor.value.slice(0, position).split("\n").length;
  cursorInfo.textContent = `Línea ${line}`;
}

function clearPanels() {
  consolePanel.textContent = "";
  errorsPanel.innerHTML = "";
  symbolsPanel.innerHTML = "";
  astPanel.textContent = "";
}

function renderTable(rows, columns) {
  if (!rows.length) return "<p class='empty'>Sin datos.</p>";
  const labels = { kind: "Tipo", description: "Descripción", line: "Línea", column: "Columna",
    id: "Identificador", symbolType: "Tipo símbolo", dataType: "Tipo dato", scope: "Ámbito" };
  const head = columns.map((c) => `<th>${labels[c] ?? c}</th>`).join("");
  const body = rows.map((row) =>
    `<tr>${columns.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}</tr>`
  ).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// Sample program showcasing GoScript features
editor.value = `struct Persona {
  string Nombre;
  int Edad;
}

func maximo(a int, b int) int {
  if a > b {
    return a
  }
  return b
}

func factorial(n int) int {
  if n <= 1 {
    return 1
  }
  return n * factorial(n - 1)
}

func main() {
  // Variables y tipos
  var nombre string = "GoScript"
  version := 2
  fmt.Println("Bienvenido a", nombre, "v" + strconv.Atoi("2"))

  // Struct
  p := Persona{Nombre: "Ana", Edad: 21}
  fmt.Println("Nombre:", p.Nombre, "Edad:", p.Edad)

  // Condicional
  fmt.Println("Maximo(10,7):", maximo(10, 7))

  // Recursion
  fmt.Println("5! =", factorial(5))

  // Slice
  nums := []int{1, 2, 3, 4, 5}
  nums = append(nums, 6)
  fmt.Println("Slice:", nums, "Len:", len(nums))

  // For range
  suma := 0
  for i, v := range nums {
    suma = suma + v
    fmt.Println("  nums[", i ,"] =", v)
  }
  fmt.Println("Suma:", suma)

  // Switch
  switch len(nums) {
  case 6:
    fmt.Println("Slice tiene 6 elementos")
  default:
    fmt.Println("Otro tamanio")
  }
}`;
updateCursor();
