/**
 * 数量表达式：tokenizer + 递归下降解析 + 求值。
 * 支持：数字、变量、四则运算、括号、白名单函数；不使用 eval。
 */

export interface QtyContext {
  days: number;
  travelers: number;
  minTemp: number;
  maxTemp: number;
}

const VARS = ['days', 'travelers', 'minTemp', 'maxTemp'] as const;
type VarName = (typeof VARS)[number];

interface FuncSpec {
  arity: number;
  fn: (...args: number[]) => number;
  hint: string;
}

const FUNCS: Record<string, FuncSpec> = {
  min: { arity: 2, fn: Math.min, hint: 'min(a, b)' },
  max: { arity: 2, fn: Math.max, hint: 'max(a, b)' },
  ceil: { arity: 1, fn: Math.ceil, hint: 'ceil(x)' },
  floor: { arity: 1, fn: Math.floor, hint: 'floor(x)' },
  round: { arity: 1, fn: Math.round, hint: 'round(x)' },
  abs: { arity: 1, fn: Math.abs, hint: 'abs(x)' },
};

export class ExprError extends Error {
  readonly pos: number;

  constructor(message: string, pos: number) {
    super(message);
    this.name = 'ExprError';
    this.pos = pos;
  }
}

type TokenKind = 'num' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma' | 'eof';

interface Token {
  kind: TokenKind;
  text: string;
  pos: number;
  value?: number;
}

type Node =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: VarName; pos: number }
  | { kind: 'call'; name: string; args: Node[]; pos: number }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/'; left: Node; right: Node; pos: number }
  | { kind: 'neg'; expr: Node };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if (ch >= '0' && ch <= '9') {
      let j = i;
      let dots = 0;
      while (j < source.length && ((source[j] >= '0' && source[j] <= '9') || source[j] === '.')) {
        if (source[j] === '.') dots += 1;
        j += 1;
      }
      const raw = source.slice(i, j);
      if (dots > 1 || raw === '.') {
        throw new ExprError(`数字格式不合法：${raw}`, i);
      }
      tokens.push({ kind: 'num', text: raw, pos: i, value: Number(raw) });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j += 1;
      tokens.push({ kind: 'ident', text: source.slice(i, j), pos: i });
      i = j;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'op', text: ch, pos: i });
      i += 1;
      continue;
    }

    if (ch === '(') {
      tokens.push({ kind: 'lparen', text: ch, pos: i });
      i += 1;
      continue;
    }

    if (ch === ')') {
      tokens.push({ kind: 'rparen', text: ch, pos: i });
      i += 1;
      continue;
    }

    if (ch === ',') {
      tokens.push({ kind: 'comma', text: ch, pos: i });
      i += 1;
      continue;
    }

    throw new ExprError(`无法识别的字符「${ch}」`, i);
  }

  tokens.push({ kind: 'eof', text: '', pos: source.length });
  return tokens;
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.parseExpr();
    const token = this.peek();
    if (token.kind !== 'eof') {
      throw new ExprError(`多余的字符「${token.text}」`, token.pos);
    }
    return node;
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private advance(): Token {
    return this.tokens[this.index++];
  }

  private parseExpr(): Node {
    let left = this.parseTerm();
    for (;;) {
      const token = this.peek();
      if (token.kind === 'op' && (token.text === '+' || token.text === '-')) {
        this.advance();
        const right = this.parseTerm();
        left = { kind: 'bin', op: token.text, left, right, pos: token.pos };
      } else {
        return left;
      }
    }
  }

  private parseTerm(): Node {
    let left = this.parseUnary();
    for (;;) {
      const token = this.peek();
      if (token.kind === 'op' && (token.text === '*' || token.text === '/')) {
        this.advance();
        const right = this.parseUnary();
        left = { kind: 'bin', op: token.text, left, right, pos: token.pos };
      } else {
        return left;
      }
    }
  }

  private parseUnary(): Node {
    const token = this.peek();
    if (token.kind === 'op' && token.text === '-') {
      this.advance();
      return { kind: 'neg', expr: this.parseUnary() };
    }
    if (token.kind === 'op' && token.text === '+') {
      this.advance();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    const token = this.peek();

    if (token.kind === 'num') {
      this.advance();
      return { kind: 'num', value: token.value ?? 0 };
    }

    if (token.kind === 'ident') {
      this.advance();

      if (this.peek().kind === 'lparen') {
        return this.parseCall(token);
      }

      if (!(VARS as readonly string[]).includes(token.text)) {
        throw new ExprError(
          `未知变量「${token.text}」，可用：${VARS.join(' / ')}`,
          token.pos,
        );
      }
      return { kind: 'var', name: token.text as VarName, pos: token.pos };
    }

    if (token.kind === 'lparen') {
      this.advance();
      const inner = this.parseExpr();
      const close = this.peek();
      if (close.kind !== 'rparen') {
        throw new ExprError('缺少右括号「)」', close.pos);
      }
      this.advance();
      return inner;
    }

    if (token.kind === 'eof') {
      throw new ExprError('表达式不完整，缺少内容', token.pos);
    }

    throw new ExprError(`此处需要数字、变量或括号，实际是「${token.text}」`, token.pos);
  }

  private parseCall(nameToken: Token): Node {
    const spec = FUNCS[nameToken.text];
    if (!spec) {
      throw new ExprError(
        `未知函数「${nameToken.text}」，可用：${Object.keys(FUNCS).join(' / ')}`,
        nameToken.pos,
      );
    }

    this.advance(); // (
    const args: Node[] = [];

    if (this.peek().kind !== 'rparen') {
      args.push(this.parseExpr());
      while (this.peek().kind === 'comma') {
        this.advance();
        args.push(this.parseExpr());
      }
    }

    const close = this.peek();
    if (close.kind !== 'rparen') {
      throw new ExprError(`函数 ${nameToken.text} 缺少右括号`, close.pos);
    }
    this.advance();

    if (args.length !== spec.arity) {
      throw new ExprError(
        `函数「${nameToken.text}」需要 ${spec.arity} 个参数（${spec.hint}），实际 ${args.length} 个`,
        nameToken.pos,
      );
    }

    return { kind: 'call', name: nameToken.text, args, pos: nameToken.pos };
  }
}

function evalNode(node: Node, ctx: QtyContext): number {
  switch (node.kind) {
    case 'num':
      return node.value;
    case 'neg':
      return -evalNode(node.expr, ctx);
    case 'var': {
      const value = ctx[node.name];
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new ExprError(`变量「${node.name}」没有取值`, node.pos);
      }
      return value;
    }
    case 'call': {
      const args = node.args.map((arg) => evalNode(arg, ctx));
      return FUNCS[node.name].fn(...args);
    }
    case 'bin': {
      const left = evalNode(node.left, ctx);
      const right = evalNode(node.right, ctx);
      switch (node.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          if (right === 0) {
            throw new ExprError('除数不能为 0', node.pos);
          }
          return left / right;
      }
    }
  }
}

const CACHE = new Map<string, Node>();

export function compileQty(expression: string): (ctx: QtyContext) => number {
  const source = expression.trim();
  let ast = CACHE.get(source);
  if (!ast) {
    ast = new Parser(tokenize(source)).parse();
    CACHE.set(source, ast);
  }
  return (ctx) => evalNode(ast as Node, ctx);
}

/** 结果收敛为不小于 1 的整数，NaN / Infinity 视为 1 */
export function normalizeQty(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.round(value));
}

export function evaluateQty(expression: string, ctx: QtyContext): number {
  return normalizeQty(compileQty(expression)(ctx));
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string; pos: number };

export function validateQty(expression: string): ValidationResult {
  if (!expression || !expression.trim()) {
    return { ok: false, message: '表达式不能为空', pos: 0 };
  }
  try {
    const run = compileQty(expression);
    run({ days: 7, travelers: 2, minTemp: 0, maxTemp: 20 });
    return { ok: true };
  } catch (error) {
    if (error instanceof ExprError) {
      return { ok: false, message: error.message, pos: error.pos };
    }
    return { ok: false, message: (error as Error).message ?? '表达式不合法', pos: 0 };
  }
}
