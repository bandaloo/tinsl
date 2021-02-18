// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var ident: any;
declare var lparen: any;
declare var rparen: any;
declare var lbrace: any;
declare var lbc: any;
declare var rbrace: any;
declare var int: any;
declare var arrow: any;
declare var kw_loop: any;
declare var kw_once: any;
declare var kw_uniform: any;
declare var kw_return: any;
declare var kw_const: any;
declare var assignment: any;
declare var kw_for: any;
declare var kw_if: any;
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
declare var kw_int: any;
declare var kw_float: any;
declare var kw_vec2: any;
declare var kw_vec3: any;
declare var kw_vec4: any;
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
declare var kw_true: any;
declare var kw_false: any;
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
  Decl,
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
  Uniform
} from "./nodes";
import { lexer } from "./lexer";

const nearleyLexer = (lexer as unknown) as NearleyLexer;

const bin = (d: any) => new BinaryExpr(d[0], d[2], d[4]);
const pre = (d: any) => new UnaryExpr(d[0], d[2]);
const post = (d: any) => new UnaryExpr(d[2], d[0], true);
const typ = (d: any) => new TypeName(d);
const sep = (d: any) => [d[0], ...d[1].map((e: any) => e[2])];

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
    {"name": "DefBlock$ebnf$1$subexpression$1", "symbols": ["_", "Params", "_"]},
    {"name": "DefBlock$ebnf$1", "symbols": ["DefBlock$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "DefBlock$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "DefBlock$ebnf$2", "symbols": []},
    {"name": "DefBlock$ebnf$2$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "DefBlock$ebnf$2", "symbols": ["DefBlock$ebnf$2", "DefBlock$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "DefBlock$ebnf$3", "symbols": []},
    {"name": "DefBlock$ebnf$3$subexpression$1", "symbols": ["FuncLine"]},
    {"name": "DefBlock$ebnf$3", "symbols": ["DefBlock$ebnf$3", "DefBlock$ebnf$3$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "DefBlock", "symbols": ["TypeName", "_", (nearleyLexer.has("ident") ? {type: "ident"} : ident), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "DefBlock$ebnf$1", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen), "_", (nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "DefBlock$ebnf$2", "DefBlock$ebnf$3", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess":  ([typ, , id, , , params, , , , , , body, ]: any) => new FuncDef(
          typ, id, params === null ? [] : params[1], body.map((e: any) => e[0])
        )
              },
    {"name": "RenderBlock$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("int") ? {type: "int"} : int), "_", (nearleyLexer.has("arrow") ? {type: "arrow"} : arrow), "_"]},
    {"name": "RenderBlock$ebnf$1", "symbols": ["RenderBlock$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock$ebnf$2$subexpression$1", "symbols": [(nearleyLexer.has("kw_loop") ? {type: "kw_loop"} : kw_loop), "_", (nearleyLexer.has("int") ? {type: "int"} : int), "_"]},
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
    {"name": "RenderBlock", "symbols": ["RenderBlock$ebnf$1", "RenderBlock$ebnf$2", "RenderBlock$ebnf$3", (nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "RenderBlock$ebnf$4", "RenderBlock$ebnf$5", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace), "_", (nearleyLexer.has("arrow") ? {type: "arrow"} : arrow), "_", (nearleyLexer.has("int") ? {type: "int"} : int)], "postprocess":  ([inNumBl, loopNumBl, onceBl, open, , , body, , , , , outNum]: any) =>
        new RenderBlock(
          onceBl !== null && onceBl[0] !== null,
          body.map((e: any) => e[0]),
          inNumBl !== null ? parseInt(inNumBl[0].text) : null,
          parseInt(outNum.text),
          loopNumBl !== null ? parseInt(loopNumBl[2].text) : null,
          open
        )
              },
    {"name": "Uniform$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "Uniform$ebnf$1", "symbols": ["Uniform$ebnf$1$subexpression$1"]},
    {"name": "Uniform$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "Uniform$ebnf$1", "symbols": ["Uniform$ebnf$1", "Uniform$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Uniform", "symbols": [(nearleyLexer.has("kw_uniform") ? {type: "kw_uniform"} : kw_uniform), "_", "TypeName", "_", (nearleyLexer.has("ident") ? {type: "ident"} : ident), "_", "Uniform$ebnf$1"], "postprocess": d => new Uniform(d[2], d[4])},
    {"name": "RenderLevel", "symbols": ["Decl"], "postprocess": id},
    {"name": "RenderLevel", "symbols": ["Expr"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Expr"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Decl"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Assign"], "postprocess": id},
    {"name": "FuncLevel", "symbols": ["Return"], "postprocess": id},
    {"name": "FuncLine$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "FuncLine$ebnf$1", "symbols": ["FuncLine$ebnf$1$subexpression$1"]},
    {"name": "FuncLine$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "FuncLine$ebnf$1", "symbols": ["FuncLine$ebnf$1", "FuncLine$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "FuncLine", "symbols": ["FuncLevel", "FuncLine$ebnf$1"], "postprocess": d => d[0]},
    {"name": "FuncLine", "symbols": ["ForLoop"], "postprocess": id},
    {"name": "FuncLine", "symbols": ["If"], "postprocess": id},
    {"name": "RenderLine$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "RenderLine$ebnf$1", "symbols": ["RenderLine$ebnf$1$subexpression$1"]},
    {"name": "RenderLine$ebnf$1$subexpression$2", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "RenderLine$ebnf$1", "symbols": ["RenderLine$ebnf$1", "RenderLine$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "RenderLine", "symbols": ["RenderLevel", "RenderLine$ebnf$1"], "postprocess": d => d[0]},
    {"name": "Return", "symbols": [(nearleyLexer.has("kw_return") ? {type: "kw_return"} : kw_return), "_", "Expr"], "postprocess": d => new Return(d[2], d[0])},
    {"name": "Decl$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("kw_const") ? {type: "kw_const"} : kw_const), "_"]},
    {"name": "Decl$ebnf$1", "symbols": ["Decl$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "Decl$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "Decl$subexpression$1", "symbols": ["TypeName", "_"]},
    {"name": "Decl$subexpression$2", "symbols": [(nearleyLexer.has("ident") ? {type: "ident"} : ident), "_"]},
    {"name": "Decl", "symbols": ["Decl$ebnf$1", "Decl$subexpression$1", "Decl$subexpression$2", (nearleyLexer.has("assignment") ? {type: "assignment"} : assignment), "_", "Expr"], "postprocess": d => new Decl(d[0] !== null, d[1][0], d[2][0], d[5], d[3])},
    {"name": "Assign", "symbols": ["Expr", "_", "AssignSymbol", "_", "Expr"], "postprocess": d => new Assign(d[0], d[2], d[4])},
    {"name": "ForInit", "symbols": ["RenderLevel"], "postprocess": id},
    {"name": "ForInit", "symbols": ["Assign"], "postprocess": id},
    {"name": "ForLoop$ebnf$1$subexpression$1", "symbols": ["ForInit"]},
    {"name": "ForLoop$ebnf$1", "symbols": ["ForLoop$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ForLoop$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "ForLoop$ebnf$2$subexpression$1", "symbols": ["RenderLevel"]},
    {"name": "ForLoop$ebnf$2", "symbols": ["ForLoop$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "ForLoop$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "ForLoop$ebnf$3$subexpression$1", "symbols": ["RenderLevel"]},
    {"name": "ForLoop$ebnf$3", "symbols": ["ForLoop$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "ForLoop$ebnf$3", "symbols": [], "postprocess": () => null},
    {"name": "ForLoop", "symbols": [(nearleyLexer.has("kw_for") ? {type: "kw_for"} : kw_for), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "ForLoop$ebnf$1", (nearleyLexer.has("lbc") ? {type: "lbc"} : lbc), "ForLoop$ebnf$2", (nearleyLexer.has("lbc") ? {type: "lbc"} : lbc), "ForLoop$ebnf$3", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen), "_", "BlockBody", "_"], "postprocess":  ([kw, , , , init, , cond, , loop, , , , body, ]: any) =>
        new ForLoop(
          init === null ? null : init[0],
          cond === null ? null : cond[0],
          loop === null ? null : loop[0],
          body,
          kw
        )
              },
    {"name": "If$ebnf$1$subexpression$1", "symbols": ["_", "Else"]},
    {"name": "If$ebnf$1", "symbols": ["If$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "If$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "If", "symbols": [(nearleyLexer.has("kw_if") ? {type: "kw_if"} : kw_if), "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "Expr", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen), "_", "BlockBody", "If$ebnf$1"], "postprocess":  ([tokn, , , , cond, , , , body, cont]: any) =>
        new If(
          cond,
          body,
          tokn,
          cont === null ? null : cont[1]
        )
              },
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
    {"name": "BlockBody", "symbols": [(nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "BlockBody$ebnf$1", "BlockBody$ebnf$2", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace), "BlockBody$ebnf$3"], "postprocess": d => d[3].map((e: any) => e[0])},
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
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_int") ? {type: "kw_int"} : kw_int)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_float") ? {type: "kw_float"} : kw_float)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_vec2") ? {type: "kw_vec2"} : kw_vec2)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_vec3") ? {type: "kw_vec3"} : kw_vec3)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_vec4") ? {type: "kw_vec4"} : kw_vec4)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat2") ? {type: "kw_mat2"} : kw_mat2)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat3") ? {type: "kw_mat3"} : kw_mat3)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat4") ? {type: "kw_mat4"} : kw_mat4)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat2x2") ? {type: "kw_mat2x2"} : kw_mat2x2)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat2x3") ? {type: "kw_mat2x3"} : kw_mat2x3)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat2x4") ? {type: "kw_mat2x4"} : kw_mat2x4)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat3x2") ? {type: "kw_mat3x2"} : kw_mat3x2)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat3x3") ? {type: "kw_mat3x3"} : kw_mat3x3)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat3x4") ? {type: "kw_mat3x4"} : kw_mat3x4)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat4x2") ? {type: "kw_mat4x2"} : kw_mat4x2)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat4x3") ? {type: "kw_mat4x3"} : kw_mat4x3)], "postprocess": typ},
    {"name": "TypeName", "symbols": [(nearleyLexer.has("kw_mat4x4") ? {type: "kw_mat4x4"} : kw_mat4x4)], "postprocess": typ},
    {"name": "Args$ebnf$1", "symbols": []},
    {"name": "Args$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("comma") ? {type: "comma"} : comma), "_", "Expr"]},
    {"name": "Args$ebnf$1", "symbols": ["Args$ebnf$1", "Args$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Args", "symbols": ["Expr", "Args$ebnf$1"], "postprocess": sep},
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
    {"name": "Atom", "symbols": [(nearleyLexer.has("ident") ? {type: "ident"} : ident)], "postprocess": d => new IdentExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_true") ? {type: "kw_true"} : kw_true)], "postprocess": d => new BoolExpr(d[0])},
    {"name": "Atom", "symbols": [(nearleyLexer.has("kw_false") ? {type: "kw_false"} : kw_false)], "postprocess": d => new BoolExpr(d[0])},
    {"name": "Atom$ebnf$1", "symbols": ["Args"], "postprocess": id},
    {"name": "Atom$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "Atom", "symbols": ["TypeName", "_", (nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "Atom$ebnf$1", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": (d: any) => new ConstructorExpr(d[2], d[0], d[4] !== null ? d[4] : [])},
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
