# Pseudo Flow
trun pseudo-code of c/js and  python style  to flowchart 


把 类 C / JS 风格的伪代码（容错型）渲染成 流程图 的纯前端小工具。
关键字仅 ASCII 英文，正文可中英文混写；输出为浏览器内 SVG，可导出 SVG/PNG 或复制图片。

打开 dist/index.html：

macOS / Windows / Linux：双击文件，或在浏览器地址栏拖入；以 file:// 方式直接运行，不需要任何后端。
整个产物是 单个 HTML 文件（JS / CSS 全部内联），方便复制到任意位置使用。

----


## 伪代码流程图预览效果

<img width="1546" height="1084" alt="iShot_2026-07-11_22 23 22" src="https://github.com/user-attachments/assets/b8668cad-de5b-435f-8dd8-e82e9e844941" />



----

## 伪代码语法（速查）

### C、JS 风格

- 块用 `{` `}` 包围；语句以 `;` 结尾。
- 控制流关键字（**仅 ASCII 英文**）：`if` / `else` / `for` / `while` / `do` / `switch` / `case` / `default` / `break` / `continue` / `return` / `throw` / `exit` / `function`。
- `function` 关键字 **可省略**：`init() { ... }` 也算函数声明。
- `for` 同时支持 `for (init; cond; update) { }` 与 `for (任意头部文本) { }` 两种形式。
- `do { ... } while (条件);` 完整支持。
- `switch / case / default / break` 完整支持；`case` 后允许任意常量/标识符标签。
- 语句体为 **任意文本直到 `;`**，或形如 `name(...)` 的调用；引号 `'..'` `".."` 内的 `; { } ( )` 不会被当成语法符号。
- 顶层（不在任何函数体内）可以混排函数声明、调用与表达式语句。
- **`return`**（浅绿三角出口）、**`throw`**（橙红三角出口）、**`exit`**（深红胶囊）：分别为正常返回、异常出口、显式终止整个程序；详见工具栏「帮助」。
- **`continue`**：`while` / `do-while` / `for`（自由文本头）→ 回到 **条件判断**；三段式 `for(init; cond; update)` → 先到 **更新表达式**，再判条件。

容错：

- 缺少 `}`：自动在末尾补齐，并在诊断条给出 *warning*。
- 多余 `}`：仅 *warning*，不强行删除。
- 解析错误：诊断条会显示位置（行/列）。


### Python 风格
（把工具栏「语法」切到 Python）

用 **真缩进** 分块、**冒号 `:`** 引导块头，**不写** `{ }`、**不写** `;`；可直接粘贴真实 Python 片段。

- 块头关键字：`def` / `if` / `elif` / `else` / `for … in …` / `while` / `class`。
- 条件 **不带圆括号**：写 `if a > b:`、`while running:`、`for x in items:`（而非 `if (a > b)`）。
- 出口 / 跳转：`return` / `raise`（≈ 类 C 的 `throw`，异常出口）/ `break` / `continue`。
- **续行** 自动处理：括号 `()[]{}` 内换行、行尾 `\` 续行、三引号 `''' """` 多行字符串都会正确并入同一条逻辑行。
- **`#` 注释**：与类 C 的 `//` 同样支持提取 + 旁注（附着规则一致）。
- **`elif`** 等价于类 C 的 `else if`（映射到同一 `IfStatement` 分支链）。
- **降级处理**（一期）：`try` / `except` / `finally` / `with` / `match` / `case` **不画异常分支**，其块头当作一条顺序步骤、块体语句内联为顺序执行 —— 能出图、不报错；后续可升级为专门的异常分支图形。
- Python 没有 `switch`；多分支请用 `if / elif / else`。
- 


