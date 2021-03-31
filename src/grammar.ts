// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var kw_fn: any;
declare var ident: any;
declare var lparen: any;
declare var rparen: any;
declare var lbrace: any;
declare var lbc: any;
declare var rbrace: any;
declare var kw_pr: any;
declare var arrow: any;
declare var kw_loop: any;
declare var kw_once: any;
declare var kw_uniform: any;
declare var kw_return: any;
declare var kw_refresh: any;
declare var kw_const: any;
declare var kw_final: any;
declare var kw_mut: any;
declare var assignment: any;
declare var decl: any;
declare var kw_def: any;
declare var kw_for: any;
declare var kw_if: any;
declare var at: any;
declare var kw_else: any;
declare var lbracket: any;
declare var rbracket: any;
declare var period: any;
declare var incr: any;
declare var decr: any;
declare var add: any;
declare var sub: any;
declare var bnot: any;
declare var not: any;
declare var mult: any;
declare var div: any;
declare var modulo: any;
declare var blshift: any;
declare var brshift: any;
declare var lt: any;
declare var gt: any;
declare var lte: any;
declare var gte: any;
declare var eq: any;
declare var neq: any;
declare var band: any;
declare var bxor: any;
declare var bor: any;
declare var and: any;
declare var xor: any;
declare var or: any;
declare var question_mark: any;
declare var colon: any;
declare var int: any;
declare var kw_int: any;
declare var kw_uint: any;
declare var kw_float: any;
declare var kw_bool: any;
declare var kw_vec2: any;
declare var kw_vec3: any;
declare var kw_vec4: any;
declare var kw_uvec2: any;
declare var kw_uvec3: any;
declare var kw_uvec4: any;
declare var kw_ivec2: any;
declare var kw_ivec3: any;
declare var kw_ivec4: any;
declare var kw_bvec2: any;
declare var kw_bvec3: any;
declare var kw_bvec4: any;
declare var kw_mat2: any;
declare var kw_mat3: any;
declare var kw_mat4: any;
declare var kw_mat2x2: any;
declare var kw_mat2x3: any;
declare var kw_mat2x4: any;
declare var kw_mat3x2: any;
declare var kw_mat3x3: any;
declare var kw_mat3x4: any;
declare var kw_mat4x2: any;
declare var kw_mat4x3: any;
declare var kw_mat4x4: any;
declare var comma: any;
declare var float: any;
declare var uint: any;
declare var kw_true: any;
declare var kw_false: any;
declare var kw_time: any;
declare var kw_pos: any;
declare var kw_res: any;
declare var kw_prev: any;
declare var frag: any;
declare var string: any;
declare var assign_add: any;
declare var assign_sub: any;
declare var assign_mult: any;
declare var assign_div: any;
declare var assign_modulo: any;
declare var assign_band: any;
declare var assign_bxor: any;
declare var assign_bor: any;
declare var assign_blshift: any;
declare var assign_brshift: any;
declare var ws: any;
declare var comment: any;
declare var multiline_comment: any;

import {
  RenderBlock,
  BinaryExpr,
  UnaryExpr,
  IntExpr,
  FloatExpr,
  SubscriptExpr,
  CallExpr,
  IdentExpr,
  BoolExpr,
  VarDecl,
  TypeName,
  ConstructorExpr,
  Assign,
  Param,
  FuncDef,
  Return,
  TernaryExpr,
  ForLoop,
  If,
  Else,
  Uniform,
  ProcDef,
  TopDef,
  Refresh,
  Frag,
  UIntExpr,
  ProcCall,
  Time,
  Pos,
  Res,
  Prev,
  ColorString,
} from "./nodes";
import { lexer } from "./lexer";

const nearleyLexer = (lexer as unknown) as NearleyLexer;

const bin = (d: any) => new BinaryExpr(d[0], d[2], d[4]);
const pre = (d: any) => new UnaryExpr(d[0], d[2]);
const post = (d: any) => new UnaryExpr(d[2], d[0], true);
const sep = (d: any) => [d[0], ...d[1].map((e: any) => e[2])];

const access = (d: any, alt: string) => d[0] !== null ? d[0][0].text : alt;

interface NearleyToken {  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: NearleyToken) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: nearleyLexer,
  ParserRules: [
    {"name": "Main$ebnf$1", "symbols": []},
    {"name": "Main$ebnf$1$subexpression$1", "symbols": ["__", "TopLevel"]},
    {"name": "Main$ebnf$1", "symbols": ["Main$ebnf$1", "Main$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Main", "symbols": ["_", "TopLevel", "Main$ebnf$1", "_"], "postprocess": ([, first, rest, ]: any) => [first, ...rest.map((t: any) => t[1])]},
    {"name": "TopLevel", "symbols": ["RenderBlock"], "postprocess": id},
    {"name": "TopLevel", "symbols": ["DefBlock"], "postprocess": id},
    {"name": "TopLevel", "symbols": ["Uniform"], "postprocess": id},
    {"name": "TopLevel", "symbols": ["ProcBlock"], "postprocess": id},
    {"name": "TopLevel", "symbols": ["TopDef"], "postprocess": id},
    {"name": "OptionalTypeName", "symbols": ["TypeName"], "postprocess": id},
    {"name": "OptionalTypeName", "symbols": [(nearleyLexer.has("kw_fn") ? {type: "kw_fn"} : kw_fn)], "postprocess": d => null},
    {"name": "DefBlock$ebnf$1$subexpression$1", "symbols": ["_", "Params"]},
    {"name": "DefBlock$ebnf$1", "symbols": ["DefBlock$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "DefBlock$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "DefBlock$ebnf$2", "symbols": []},
    {"name": "DefBlock$ebnf$2$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "DefBlock$ebnf$2", "symbols": ["DefBlock$ebnf$2", "DefBlock$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "DefBlock$ebnf$3", "symbols": []},
    {"name": "DefBlock$ebnf$3$subexpression$1", "symbols": ["FuncLine"]},
    {"name": "DefBlock$ebnf$3", "symbols": ["DefBlock$ebnf$3", "DefBlock$ebnf$3$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "DefBlock", "symbols": ["OptionalTypeName", "_", (nearleyLexer.has("ident") ? {type: "ident"} : ident), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "DefBlock$ebnf$1", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen), "_", (nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "DefBlock$ebnf$2", "_", "DefBlock$ebnf$3", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess":  ([typ, , id, , , params, , , , , , , body, ]: any) => new FuncDef(
          typ, id, params === null ? [] : params[1], body.map((e: any) => e[0])
        )
              },
    {"name": "ProcBlock$ebnf$1$subexpression$1", "symbols": ["_", "Params"]},
    {"name": "ProcBlock$ebnf$1", "symbols": ["ProcBlock$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ProcBlock$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "ProcBlock$ebnf$2", "symbols": []},
    {"name": "ProcBlock$ebnf$2$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "ProcBlock$ebnf$2", "symbols": ["ProcBlock$ebnf$2", "ProcBlock$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "ProcBlock$ebnf$3", "symbols": []},
    {"name": "ProcBlock$ebnf$3$subexpression$1", "symbols": ["RenderLine"]},
    {"name": "ProcBlock$ebnf$3", "symbols": ["ProcBlock$ebnf$3", "ProcBlock$ebnf$3$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "ProcBlock", "symbols": [(nearleyLexer.has("kw_pr") ? {type: "kw_pr"} : kw_pr), "_", (nearleyLexer.has("ident") ? {type: "ident"} : ident), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "ProcBlock$ebnf$1", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen), "_", (nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "ProcBlock$ebnf$2", "_", "ProcBlock$ebnf$3", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess":  ([, , id, , , params, , , , , , , body, ,]: any) => new ProcDef(
          id, params === null ? [] : params[1], body.map((e: any) => e[0])
        )
              },
    {"name": "RenderBlock$ebnf$1$subexpression$1", "symbols": ["Expr", "_", (nearleyLexer.has("arrow") ? {type: "arrow"} : arrow), "_"]},
    {"name": "RenderBlock$ebnf$1", "symbols": ["RenderBlock$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock$ebnf$2$subexpression$1", "symbols": [(nearleyLexer.has("kw_loop") ? {type: "kw_loop"} : kw_loop), "_", "Expr", "_"]},
    {"name": "RenderBlock$ebnf$2", "symbols": ["RenderBlock$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock$ebnf$3$subexpression$1", "symbols": [(nearleyLexer.has("kw_once") ? {type: "kw_once"} : kw_once), "_"]},
    {"name": "RenderBlock$ebnf$3", "symbols": ["RenderBlock$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$3", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock$ebnf$4", "symbols": []},
    {"name": "RenderBlock$ebnf$4$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "RenderBlock$ebnf$4", "symbols": ["RenderBlock$ebnf$4", "RenderBlock$ebnf$4$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "RenderBlock$ebnf$5", "symbols": []},
    {"name": "RenderBlock$ebnf$5$subexpression$1", "symbols": ["RenderLine"]},
    {"name": "RenderBlock$ebnf$5", "symbols": ["RenderBlock$ebnf$5", "RenderBlock$ebnf$5$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "RenderBlock$ebnf$6$subexpression$1", "symbols": ["_", (nearleyLexer.has("arrow") ? {type: "arrow"} : arrow), "_", "Expr"]},
    {"name": "RenderBlock$ebnf$6", "symbols": ["RenderBlock$ebnf$6$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$6", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock", "symbols": ["RenderBlock$ebnf$1", "RenderBlock$ebnf$2", "RenderBlock$ebnf$3", (nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "RenderBlock$ebnf$4", "_", "RenderBlock$ebnf$5", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace), "RenderBlock$ebnf$6"], "postprocess":  ([inNumBl, loopNumBl, onceBl, open, , , body, , outNumBl]: any) => {
          const blockHelper = (bl: null | any[], num: number) => bl !== null ? (bl[num] instanceof IntExpr ? parseInt(bl[num].getToken().text) : bl[num]) : null;
          return new RenderBlock(
            onceBl !== null && onceBl[0] !== null,
            body.map((e: any) => e[0]),
            blockHelper(inNumBl, 0),
            blockHelper(outNumBl, 3),
            blockHelper(loopNumBl, 2),
            open
          )
        }
              },
    {"name": "Uniform$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "Uniform$ebnf$1", "symbols": ["Uniform$ebnf$1$subexpression$1"]},
    {"name": "Uniform$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "Uniform$ebnf$1", "symbols": ["Uniform$ebnf$1", "Uniform$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Uniform", "symbols": [(nearleyLexer.has("kw_uniform") ? {type: "kw_uniform"} : kw_uniform), "_", "TypeName", "_", (nearleyLexer.has("ident") ? {type: "ident"} : ident), "Uniform$ebnf$1"], "postprocess": d => new Uniform(d[2], d[4])},
    {"name": "RenderLevel", "symbols": ["Decl"], "postprocess": id},
    {"name": "RenderLevel", "symbols": ["Expr"], "postprocess": id},
    {"name": "RenderLevel", "symbols": ["Refresh"], "postprocess": id},
    {"name": "RenderLevel", "symbols": ["ProcCall"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Expr"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Decl"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Assign"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Return"], "postprocess": id},
    {"name": "FuncLine$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "FuncLine$ebnf$1", "symbols": ["FuncLine$ebnf$1$subexpression$1"]},
    {"name": "FuncLine$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "FuncLine$ebnf$1", "symbols": ["FuncLine$ebnf$1", "FuncLine$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "FuncLine", "symbols": ["FuncLevel", "FuncLine$ebnf$1", "_"], "postprocess": d => d[0]},
    {"name": "FuncLine", "symbols": ["ForLoop"], "postprocess": d => d[0]},
    {"name": "FuncLine", "symbols": ["If"], "postprocess": id},
    {"name": "RenderLine$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "RenderLine$ebnf$1", "symbols": ["RenderLine$ebnf$1$subexpression$1"]},
    {"name": "RenderLine$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "RenderLine$ebnf$1", "symbols": ["RenderLine$ebnf$1", "RenderLine$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "RenderLine", "symbols": ["RenderLevel", "RenderLine$ebnf$1", "_"], "postprocess": d => d[0]},
    {"name": "RenderLine", "symbols": ["RenderBlock", "_"], "postprocess": d => d[0]},
    {"name": "Return", "symbols": [(nearleyLexer.has("kw_return") ? {type: "kw_return"} : kw_return), "_", "Expr"], "postprocess": d => new Return(d[2], d[0])},
    {"name": "Refresh", "symbols": [(nearleyLexer.has("kw_refresh") ? {type: "kw_refresh"} : kw_refresh)], "postprocess": d => new Refresh(d[0])},
    {"name": "NormalAccess", "symbols": [(nearleyLexer.has("kw_const") ? {type: "kw_const"} : kw_const)], "postprocess": id},
    {"name": "NormalAccess", "symbols": [(nearleyLexer.has("kw_final") ? {type: "kw_final"} : kw_final)], "postprocess": id},
    {"name": "DeclAccess", "symbols": [(nearleyLexer.has("kw_const") ? {type: "kw_const"} : kw_const)], "postprocess": id},
    {"name": "DeclAccess", "symbols": [(nearleyLexer.has("kw_mut") ? {type: "kw_mut"} : kw_mut)], "postprocess": id},
    {"name": "Decl$ebnf$1$subexpression$1", "symbols": ["NormalAccess", "_"]},
    {"name": "Decl$ebnf$1", "symbols": ["Decl$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "Decl$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "Decl$subexpression$1", "symbols": ["TypeName", "_"]},
    {"name": "Decl$subexpression$2", "symbols": [(nearleyLexer.has("ident") ? {type: "ident"} : ident), "_"]},
    {"name": "Decl", "symbols": ["Decl$ebnf$1", "Decl$subexpression$1", "Decl$subexpression$2", (nearleyLexer.has("assignment") ? {type: "assignment"} : assignment), "_", "Expr"], "postprocess":  d =>
        new VarDecl(
           access(d, "mut"),
           d[1][0], d[2][0], d[5], d[3]
        )
              },
    {"name": "Decl$ebnf$2$subexpression$1", "symbols": ["DeclAccess", "_"]},
    {"name": "Decl$ebnf$2", "symbols": ["Decl$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "Decl$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "Decl$subexpression$3", "symbols": [(nearleyLexer.has("ident") ? {type: "ident"} : ident), "_"]},
    {"name": "Decl", "symbols": ["Decl$ebnf$2", "Decl$subexpression$3", (nearleyLexer.has("decl") ? {type: "decl"} : decl), "_", "Expr"], "postprocess":  d =>
        new VarDecl(
          access(d, "final"),
          null, d[1][0], d[4], d[2]
        )
              },
    {"name": "TopDef", "symbols": [(nearleyLexer.has("kw_def") ? {type: "kw_def"} : kw_def), "_", (nearleyLexer.has("ident") ? {type: "ident"} : ident), "__", "Expr"], "postprocess": d => new TopDef(d[2], d[4])},
    {"name": "Assign", "symbols": ["Expr", "_", "AssignSymbol", "_", "Expr"], "postprocess": d => new Assign(d[0], d[2], d[4])},
    {"name": "ForInit", "symbols": ["Decl"], "postprocess": id},
    {"name": "ForInit", "symbols": ["Expr"], "postprocess": id},
    {"name": "ForInit", "symbols": ["Assign"], "postprocess": id},
    {"name": "ForFinal", "symbols": ["Expr"], "postprocess": id},
    {"name": "ForFinal", "symbols": ["Assign"], "postprocess": id},
    {"name": "ForLoop$ebnf$1$subexpression$1", "symbols": ["_", "ForInit"]},
    {"name": "ForLoop$ebnf$1", "symbols": ["ForLoop$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ForLoop$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "ForLoop$ebnf$2$subexpression$1", "symbols": ["_", "Expr"]},
    {"name": "ForLoop$ebnf$2", "symbols": ["ForLoop$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "ForLoop$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "ForLoop$ebnf$3$subexpression$1", "symbols": ["_", "ForFinal"]},
    {"name": "ForLoop$ebnf$3", "symbols": ["ForLoop$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "ForLoop$ebnf$3", "symbols": [], "postprocess": () => null},
    {"name": "ForLoop", "symbols": [(nearleyLexer.has("kw_for") ? {type: "kw_for"} : kw_for), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "ForLoop$ebnf$1", (nearleyLexer.has("lbc") ? {type: "lbc"} : lbc), "ForLoop$ebnf$2", (nearleyLexer.has("lbc") ? {type: "lbc"} : lbc), "ForLoop$ebnf$3", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen), "_", "BlockBody"], "postprocess":  ([kw, , , init, , cond, , loop, , , , body]: any) =>
        new ForLoop(
          init === null ? null : init[1],
          cond === null ? null : cond[1],
          loop === null ? null : loop[1],
          body,
          kw
        )
              },
    {"name": "If$ebnf$1$subexpression$1", "symbols": ["Else"]},
    {"name": "If$ebnf$1", "symbols": ["If$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "If$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "If", "symbols": [(nearleyLexer.has("kw_if") ? {type: "kw_if"} : kw_if), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "Expr", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen), "_", "BlockBody", "If$ebnf$1"], "postprocess":  ([tokn, , , , cond, , , , body, cont]: any) =>
        new If(
          cond,
          body,
          tokn,
          cont === null ? null : cont[0]
        )
              },
    {"name": "ProcCall$ebnf$1", "symbols": ["Args"], "postprocess": id},
    {"name": "ProcCall$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "ProcCall", "symbols": [(nearleyLexer.has("at") ? {type: "at"} : at), (nearleyLexer.has("ident") ? {type: "ident"} : ident), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "ProcCall$ebnf$1", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": (d: any) => new ProcCall(d[3], new IdentExpr(d[1]), d[5] !== null ? d[5] : [])},
    {"name": "Else", "symbols": [(nearleyLexer.has("kw_else") ? {type: "kw_else"} : kw_else), "_", "BlockBody"], "postprocess": d => new Else(d[2], d[0])},
    {"name": "BlockBody", "symbols": ["FuncLine"], "postprocess": d => [d[0]]},
    {"name": "BlockBody$ebnf$1", "symbols": []},
    {"name": "BlockBody$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "BlockBody$ebnf$1", "symbols": ["BlockBody$ebnf$1", "BlockBody$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "BlockBody$ebnf$2", "symbols": []},
    {"name": "BlockBody$ebnf$2$subexpression$1", "symbols": ["FuncLine"]},
    {"name": "BlockBody$ebnf$2", "symbols": ["BlockBody$ebnf$2", "BlockBody$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "BlockBody$ebnf$3", "symbols": []},
    {"name": "BlockBody$ebnf$3$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "BlockBody$ebnf$3", "symbols": ["BlockBody$ebnf$3", "BlockBody$ebnf$3$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "BlockBody", "symbols": [(nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "BlockBody$ebnf$1", "_", "BlockBody$ebnf$2", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace), "BlockBody$ebnf$3", "_"], "postprocess": d => d[3].map((e: any) => e[0])},
    {"name": "Paren", "symbols": [(nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "Expr", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => d[2]},
    {"name": "Paren", "symbols": ["Atom"], "postprocess": id},
    {"name": "MiscPost", "symbols": ["MiscPost", "_", (nearleyLexer.has("lbracket") ? {type: "lbracket"} : lbracket), "_", "Paren", "_", (nearleyLexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": (d: any) => new SubscriptExpr(d[2], d[0], d[4])},
    {"name": "MiscPost$ebnf$1", "symbols": ["Args"], "postprocess": id},
    {"name": "MiscPost$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "MiscPost", "symbols": ["MiscPost", "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "MiscPost$ebnf$1", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": (d: any) => new CallExpr(d[2], d[0], d[4] !== null ? d[4] : [])},
    {"name": "MiscPost", "symbols": ["MiscPost", "_", (nearleyLexer.has("period") ? {type: "period"} : period), "_", "Paren"], "postprocess": bin},
    {"name": "MiscPost", "symbols": ["MiscPost", "_", (nearleyLexer.has("incr") ? {type: "incr"} : incr)], "postprocess": post},
    {"name": "MiscPost", "symbols": ["MiscPost", "_", (nearleyLexer.has("decr") ? {type: "decr"} : decr)], "postprocess": post},
    {"name": "MiscPost", "symbols": ["Paren"], "postprocess": id},
    {"name": "Unary", "symbols": [(nearleyLexer.has("incr") ? {type: "incr"} : incr), "_", "Unary"], "postprocess": pre},
    {"name": "Unary", "symbols": [(nearleyLexer.has("decr") ? {type: "decr"} : decr), "_", "Unary"], "postprocess": pre},
    {"name": "Unary", "symbols": [(nearleyLexer.has("add") ? {type: "add"} : add), "_", "Unary"], "postprocess": pre},
    {"name": "Unary", "symbols": [(nearleyLexer.has("sub") ? {type: "sub"} : sub), "_", "Unary"], "postprocess": pre},
    {"name": "Unary", "symbols": [(nearleyLexer.has("bnot") ? {type: "bnot"} : bnot), "_", "Unary"], "postprocess": pre},
    {"name": "Unary", "symbols": [(nearleyLexer.has("not") ? {type: "not"} : not), "_", "Unary"], "postprocess": pre},
    {"name": "Unary", "symbols": ["MiscPost"], "postprocess": id},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", (nearleyLexer.has("mult") ? {type: "mult"} : mult), "_", "Unary"], "postprocess": bin},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", (nearleyLexer.has("div") ? {type: "div"} : div), "_", "Unary"], "postprocess": bin},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", (nearleyLexer.has("modulo") ? {type: "modulo"} : modulo), "_", "Unary"], "postprocess": bin},
    {"name": "MultDiv", "symbols": ["Unary"], "postprocess": id},
    {"name": "AddSub", "symbols": ["AddSub", "_", (nearleyLexer.has("add") ? {type: "add"} : add), "_", "MultDiv"], "postprocess": bin},
    {"name": "AddSub", "symbols": ["AddSub", "_", (nearleyLexer.has("sub") ? {type: "sub"} : sub), "_", "MultDiv"], "postprocess": bin},
    {"name": "AddSub", "symbols": ["MultDiv"], "postprocess": id},
    {"name": "BitShift", "symbols": ["BitShift", "_", (nearleyLexer.has("blshift") ? {type: "blshift"} : blshift), "_", "AddSub"], "postprocess": bin},
    {"name": "BitShift", "symbols": ["BitShift", "_", (nearleyLexer.has("brshift") ? {type: "brshift"} : brshift), "_", "AddSub"], "postprocess": bin},
    {"name": "BitShift", "symbols": ["AddSub"], "postprocess": id},
    {"name": "Relational", "symbols": ["Relational", "_", (nearleyLexer.has("lt") ? {type: "lt"} : lt), "_", "BitShift"], "postprocess": bin},
    {"name": "Relational", "symbols": ["Relational", "_", (nearleyLexer.has("gt") ? {type: "gt"} : gt), "_", "BitShift"], "postprocess": bin},
    {"name": "Relational", "symbols": ["Relational", "_", (nearleyLexer.has("lte") ? {type: "lte"} : lte), "_", "BitShift"], "postprocess": bin},
    {"name": "Relational", "symbols": ["Relational", "_", (nearleyLexer.has("gte") ? {type: "gte"} : gte), "_", "BitShift"], "postprocess": bin},
    {"name": "Relational", "symbols": ["BitShift"], "postprocess": id},
    {"name": "Equality", "symbols": ["Equality", "_", (nearleyLexer.has("eq") ? {type: "eq"} : eq), "_", "Relational"], "postprocess": bin},
    {"name": "Equality", "symbols": ["Equality", "_", (nearleyLexer.has("neq") ? {type: "neq"} : neq), "_", "Relational"], "postprocess": bin},
    {"name": "Equality", "symbols": ["Relational"], "postprocess": id},
    {"name": "BitAnd", "symbols": ["BitAnd", "_", (nearleyLexer.has("band") ? {type: "band"} : band), "_", "Equality"], "postprocess": bin},
    {"name": "BitAnd", "symbols": ["Equality"], "postprocess": id},
    {"name": "BitXor", "symbols": ["BitXor", "_", (nearleyLexer.has("bxor") ? {type: "bxor"} : bxor), "_", "BitAnd"], "postprocess": bin},
    {"name": "BitXor", "symbols": ["BitAnd"], "postprocess": id},
    {"name": "BitOr", "symbols": ["BitOr", "_", (nearleyLexer.has("bor") ? {type: "bor"} : bor), "_", "BitXor"], "postprocess": bin},
    {"name": "BitOr", "symbols": ["BitXor"], "postprocess": id},
    {"name": "LogicAnd", "symbols": ["LogicAnd", "_", (nearleyLexer.has("and") ? {type: "and"} : and), "_", "BitOr"], "postprocess": bin},
    {"name": "LogicAnd", "symbols": ["BitOr"], "postprocess": id},
    {"name": "LogicXor", "symbols": ["LogicXor", "_", (nearleyLexer.has("xor") ? {type: "xor"} : xor), "_", "LogicAnd"], "postprocess": bin},
    {"name": "LogicXor", "symbols": ["LogicAnd"], "postprocess": id},
    {"name": "LogicOr", "symbols": ["LogicOr", "_", (nearleyLexer.has("or") ? {type: "or"} : or), "_", "LogicXor"], "postprocess": bin},
    {"name": "LogicOr", "symbols": ["LogicXor"], "postprocess": id},
    {"name": "Ternary", "symbols": ["LogicOr", "_", "MiddleTernary", "_", "Ternary"], "postprocess": d => new TernaryExpr(d[0], d[2].expr, d[4], d[2].tok)},
    {"name": "Ternary", "symbols": ["LogicOr"], "postprocess": id},
    {"name": "Expr", "symbols": ["Ternary"], "postprocess": id},
    {"name": "MiddleTernary", "symbols": [(nearleyLexer.has("question_mark") ? {type: "question_mark"} : question_mark), "_", "Expr", "_", (nearleyLexer.has("colon") ? {type: "colon"} : colon)], "postprocess": d => { return { tok: d[0], expr: d[2] } }},
    {"name": "TypeName$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": ["_", (nearleyLexer.has("int") ? {type: "int"} : int)]},
    {"name": "TypeName$ebnf$1$subexpression$1$ebnf$1", "symbols": ["TypeName$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "TypeName$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "TypeName$ebnf$1$subexpression$1", "symbols": ["_", (nearleyLexer.has("lbracket") ? {type: "lbracket"} : lbracket), "TypeName$ebnf$1$subexpression$1$ebnf$1", "_", (nearleyLexer.has("rbracket") ? {type: "rbracket"} : rbracket)]},
    {"name": "TypeName$ebnf$1", "symbols": ["TypeName$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "TypeName$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "TypeName", "symbols": ["TypeWord", "TypeName$ebnf$1"], "postprocess": d => new TypeName(d[0], d[1] === null ? null : d[1][2] === null ? 0 : parseInt(d[1][2][1]))},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_int") ? {type: "kw_int"} : kw_int)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_uint") ? {type: "kw_uint"} : kw_uint)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_float") ? {type: "kw_float"} : kw_float)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_bool") ? {type: "kw_bool"} : kw_bool)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_vec2") ? {type: "kw_vec2"} : kw_vec2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_vec3") ? {type: "kw_vec3"} : kw_vec3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_vec4") ? {type: "kw_vec4"} : kw_vec4)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_uvec2") ? {type: "kw_uvec2"} : kw_uvec2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_uvec3") ? {type: "kw_uvec3"} : kw_uvec3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_uvec4") ? {type: "kw_uvec4"} : kw_uvec4)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_ivec2") ? {type: "kw_ivec2"} : kw_ivec2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_ivec3") ? {type: "kw_ivec3"} : kw_ivec3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_ivec4") ? {type: "kw_ivec4"} : kw_ivec4)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_bvec2") ? {type: "kw_bvec2"} : kw_bvec2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_bvec3") ? {type: "kw_bvec3"} : kw_bvec3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_bvec4") ? {type: "kw_bvec4"} : kw_bvec4)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat2") ? {type: "kw_mat2"} : kw_mat2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat3") ? {type: "kw_mat3"} : kw_mat3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat4") ? {type: "kw_mat4"} : kw_mat4)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat2x2") ? {type: "kw_mat2x2"} : kw_mat2x2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat2x3") ? {type: "kw_mat2x3"} : kw_mat2x3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat2x4") ? {type: "kw_mat2x4"} : kw_mat2x4)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat3x2") ? {type: "kw_mat3x2"} : kw_mat3x2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat3x3") ? {type: "kw_mat3x3"} : kw_mat3x3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat3x4") ? {type: "kw_mat3x4"} : kw_mat3x4)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat4x2") ? {type: "kw_mat4x2"} : kw_mat4x2)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat4x3") ? {type: "kw_mat4x3"} : kw_mat4x3)], "postprocess": id},
    {"name": "TypeWord", "symbols": [(nearleyLexer.has("kw_mat4x4") ? {type: "kw_mat4x4"} : kw_mat4x4)], "postprocess": id},
    {"name": "Arg$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("ident") ? {type: "ident"} : ident), "_", (nearleyLexer.has("colon") ? {type: "colon"} : colon), "_"]},
    {"name": "Arg$ebnf$1", "symbols": ["Arg$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "Arg$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "Arg", "symbols": ["Arg$ebnf$1", "Expr"], "postprocess": d => d[0] === null ? d[1] : {id: d[0][0], expr: d[1]}},
    {"name": "Args$ebnf$1", "symbols": []},
    {"name": "Args$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("comma") ? {type: "comma"} : comma), "_", "Arg"]},
    {"name": "Args$ebnf$1", "symbols": ["Args$ebnf$1", "Args$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Args", "symbols": ["Arg", "Args$ebnf$1"], "postprocess": sep},
    {"name": "Params$ebnf$1", "symbols": []},
    {"name": "Params$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("comma") ? {type: "comma"} : comma), "_", "Param"]},
    {"name": "Params$ebnf$1", "symbols": ["Params$ebnf$1", "Params$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Params", "symbols": ["Param", "Params$ebnf$1"], "postprocess": sep},
    {"name": "Param$ebnf$1$subexpression$1", "symbols": ["_", (nearleyLexer.has("assignment") ? {type: "assignment"} : assignment), "_", "Expr"]},
    {"name": "Param$ebnf$1", "symbols": ["Param$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "Param$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "Param", "symbols": ["TypeName", "_", (nearleyLexer.has("ident") ? {type: "ident"} : ident), "Param$ebnf$1"], "postprocess": d => new Param(d[0], d[2], d[3] === null ? null : d[3][3])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("float") ? {type: "float"} : float)], "postprocess": d => new FloatExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("int") ? {type: "int"} : int)], "postprocess": d => new IntExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("uint") ? {type: "uint"} : uint)], "postprocess": d => new UIntExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("ident") ? {type: "ident"} : ident)], "postprocess": d => new IdentExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_true") ? {type: "kw_true"} : kw_true)], "postprocess": d => new BoolExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_false") ? {type: "kw_false"} : kw_false)], "postprocess": d => new BoolExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_time") ? {type: "kw_time"} : kw_time)], "postprocess": d => new Time(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_pos") ? {type: "kw_pos"} : kw_pos)], "postprocess": d => new Pos(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_res") ? {type: "kw_res"} : kw_res)], "postprocess": d => new Res(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_prev") ? {type: "kw_prev"} : kw_prev)], "postprocess": d => new Prev(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("frag") ? {type: "frag"} : frag)], "postprocess": d => new Frag(d[0])},
    {"name": "Atom$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("int") ? {type: "int"} : int)]},
    {"name": "Atom$ebnf$1", "symbols": ["Atom$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "Atom$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "Atom", "symbols": [(nearleyLexer.has("string") ? {type: "string"} : string), "Atom$ebnf$1"], "postprocess": d => new ColorString(d[0], d[1] === null ? null : parseInt(d[1][0].text))},
    {"name": "Atom$ebnf$2", "symbols": ["Args"], "postprocess": id},
    {"name": "Atom$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "Atom", "symbols": ["TypeName", "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "Atom$ebnf$2", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": (d: any) => new ConstructorExpr(d[2], d[0], d[4] !== null ? d[4] : [])},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assignment") ? {type: "assignment"} : assignment)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_add") ? {type: "assign_add"} : assign_add)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_sub") ? {type: "assign_sub"} : assign_sub)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_mult") ? {type: "assign_mult"} : assign_mult)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_div") ? {type: "assign_div"} : assign_div)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_modulo") ? {type: "assign_modulo"} : assign_modulo)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_band") ? {type: "assign_band"} : assign_band)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_bxor") ? {type: "assign_bxor"} : assign_bxor)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_bor") ? {type: "assign_bor"} : assign_bor)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_blshift") ? {type: "assign_blshift"} : assign_blshift)], "postprocess": id},
    {"name": "AssignSymbol", "symbols": [(nearleyLexer.has("assign_brshift") ? {type: "assign_brshift"} : assign_brshift)], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("multiline_comment") ? {type: "multiline_comment"} : multiline_comment)]},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "_$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "__$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "__$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("multiline_comment") ? {type: "multiline_comment"} : multiline_comment)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1$subexpression$1"]},
    {"name": "__$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "__$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("multiline_comment") ? {type: "multiline_comment"} : multiline_comment)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "__$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"]}
  ],
  ParserStart: "Main",
};

export default grammar;
