[English](README-en.md) | [中文](README.md)     
----

# Pseudo Flow

Turn C/JS and Python-style pseudo-code into flowcharts.

A pure front-end utility that renders C/JS-style pseudo-code (with fault tolerance) into flowcharts.
Keywords must be in ASCII English, while the body text can be a mix of Chinese and English. The output is rendered as an in-browser SVG, which can be exported as SVG/PNG or copied as an image.

### How to Run

Open `dist/index.html`:

* **macOS / Windows / Linux:** Double-click the file or drag and drop it into your browser's address bar. It runs directly via the `file://` protocol without requiring any backend.
* The entire build output is a **single HTML file** (with all JS/CSS inlined), making it easy to copy and use anywhere.

---

## Flowchart Preview

---

## Pseudo-code Syntax (Cheat Sheet)

### C / JS Style

* Code blocks are enclosed in `{` `}`; statements must end with a semicolon `;`.
* Control flow keywords (**ASCII English only**): `if` / `else` / `for` / `while` / `do` / `switch` / `case` / `default` / `break` / `continue` / `return` / `throw` / `exit` / `function`.
* The `function` keyword **is optional**: `init() { ... }` is perfectly valid as a function declaration.
* `for` loops support both standard `for (init; cond; update) { }` and free-form `for (any free text) { }` formats.
* `do { ... } while (condition);` loops are fully supported.
* `switch / case / default / break` structures are fully supported. Any constant or identifier label is allowed after a `case`.
* A statement body consists of **any text up to the next `;**`, or a function call like `name(...)`. Symbols like `; { } ( )` inside single `'..'` or double `".."` quotes will not be treated as syntax delimiters.
* At the top level (outside of any function body), you can freely mix function declarations, calls, and expression statements.
* **`return`** (light green triangle exit), **`throw`** (orange-red triangle exit), and **`exit`** (dark red capsule): Represent normal return, exception exit, and explicit program termination respectively. See the toolbar "Help" for details.
* **`continue`**: In `while` / `do-while` / `for` (free-text header) loops $\rightarrow$ jumps back to the **condition check**. In standard 3-part `for(init; cond; update)` loops $\rightarrow$ jumps to the **update expression** first, then checks the condition.

**Fault Tolerance:**

* Missing `}`: Automatically appended at the end, displaying a *warning* in the diagnostics bar.
* Redundant `}`: Displays a *warning* without forcefully deleting it.
* Parsing errors: The diagnostics bar will pinpoint the exact location (Line/Column).

---

### Python Style

(Switch the toolbar "Syntax" to Python)

Blocks are defined by **true indentation** and headers are introduced by a **colon `:**`. You **do not** need to write `{ }` or `;`. You can directly paste actual Python code snippets.

* Block header keywords: `def` / `if` / `elif` / `else` / `for … in …` / `while` / `class`.
* Conditions **do not use parentheses**: write `if a > b:`, `while running:`, `for x in items:` (instead of `if (a > b)`).
* Exits / Jumps: `return` / `raise` ($\approx$ equivalent to C-style `throw`, an exception exit) / `break` / `continue`.
* **Line Continuations** are handled automatically: line breaks inside brackets `()[]{}`, explicit line continuations with trailing backslashes `\`, and multi-line strings with triple quotes `''' """` will all be correctly merged into a single logical line.
* **`#` Comments**: Supported just like C-style `//` for extraction and side-notes (adhering to the same attachment rules).
* **`elif`** is equivalent to C-style `else if` (mapping to the same `IfStatement` branch chain).
* **Fallback Handling** (Phase 1): `try` / `except` / `finally` / `with` / `match` / `case` **do not render exceptional branches**. Their block headers are treated as sequential steps, and the internal statements are lined up sequentially — this ensures a flowchart is generated without errors. Dedicated visual layouts for exceptions may be introduced in future updates.
* Python does not have a `switch` statement; please use `if / elif / else` for multi-branch logic. 


