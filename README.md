# SNF

一种用于定义 `SQL` 类语言的简洁语法标准，参考 `BNF` 而来。

### 关键字

定义流程，`[]{}|.`。

### 基本单元

- 内容块：小写字母开始仅包含小写数字下划线，到空格结束，内容用于替换
- 定义块：大写字母开始仅包含大写数字下划线，到空格结束，内容直接输出
- 可选块：以 `[` 开头，以 `]` 结尾，代表内容可选
- 枚举块：以 `{` 开头，以 `}` 结尾，选项用 `|` 分隔，代表其内容替换为枚举的某一项
- 重复块：`...`

### 限制

- 内容块必须以小写开头
- 可选块仅能包含枚举块
- 枚举块中的每个枚举为一个基本单元

### 简写

- 若可选块仅包含一个枚举块，那么枚举块的 `{}` 可不写，但内容解析后仍会包含
