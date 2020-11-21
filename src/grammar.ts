// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var float: any;
declare var int: any;

import { test } from "./nodes";
import { lexer } from "./lexer";
// cast the moo lexer to the nearley lexer
const nearleyLexer = (lexer as unknown) as NearleyLexer;
console.log(test);

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
    {"name": "number", "symbols": [(nearleyLexer.has("float") ? {type: "float"} : float)]},
    {"name": "number", "symbols": [(nearleyLexer.has("int") ? {type: "int"} : int)], "postprocess": id}
  ],
  ParserStart: "number",
};

export default grammar;
