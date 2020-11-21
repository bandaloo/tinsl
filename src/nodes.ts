import type { Token } from "moo";

export const test = "test!";

// TODO stricter types for operator string

export type Expr =
  | BinaryExpr
  | UnaryExpr
  | FloatExpr
  | IntExpr
  | VecExpr
  | FuncCallExpr;

export interface Type {
  id: "type";
  type: Token | null;
}

export interface BinaryExpr {
  id: "binaryexpr";
  operator: Token;
  left: Expr;
  right: Expr;
}

export interface UnaryExpr {
  id: "unaryexpr";
  operator: Token;
  argument: Expr;
}

export interface FloatExpr {
  id: "floatexpr";
  value: Token;
}

export interface IntExpr {
  id: "intexpr";
  value: Token;
}

export interface VecExpr {
  id: "vecexpr";
  call: Token;
}

export interface FuncDecl {
  id: "funcdecl";
  identifier: Token;
  returnType: Type;
  paramTypes: Type[];
  paramIdents: Token[];
  body: Expr[];
}

export interface FuncCallExpr {
  id: "funccallexpr";
  identifier: Token;
  arguments: Expr[];
}

export interface ProcDecl {
  id: "procdecl";
  identifier: Token;
  paramTypes: Type[];
  paramIdents: Token[];
  body: Expr[];
}

export interface ProcCall {
  id: "proccall";
  identifier: Token;
  arguments: Expr[];
}

export interface RenderOp {
  id: "renderop";
  inChannel: Token | null;
  outChannel: Token;
  operations: (Expr | ProcCall)[];
}

export interface Program {
  body: (ProcDecl | FuncDecl | RenderOp)[];
}
