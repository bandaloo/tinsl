import type { Token } from "moo";

export const test = "test!";

// TODO stricter types for operator string
interface BaseExpr {
  line: number;
  col: number;
}

interface BinaryExpr extends BaseExpr {
  operator: string;
  left: BaseExpr;
  right: BaseExpr;
}

interface UnaryExpr extends BaseExpr {
  operator: string;
  argument: BaseExpr;
}

interface FloatExpr extends BaseExpr {
  value: string;
}

interface IntExpr extends BaseExpr {
  value: string;
}

interface VecExpr extends BaseExpr {}
