import { expect } from "chai";
import { VarDecl, IntExpr, LexicalScope, TypeName } from "./nodes";
import { extractExpr, parseAndCheck, tok } from "./testhelpers";
import {
  dimensions,
  binaryTyping,
  unaryTyping,
  ternaryTyping,
  callReturnType,
  builtIns,
  constructors,
  vectorAccessTyping,
  ArrayType,
  SpecType,
} from "./typing";

const els = () => new LexicalScope();

describe("regex on vec and mat dimensions", () => {
  it("matches matmxn", () => {
    expect(dimensions("mat2x3")).to.deep.equal(["3", "2"]);
  });

  it("matches matm", () => {
    expect(dimensions("mat2")).to.deep.equal(["2", "2"]);
  });

  it("matches vec on left", () => {
    expect(dimensions("vec2", "left")).to.deep.equal(["1", "2"]);
  });

  it("matches vec on right", () => {
    expect(dimensions("vec2", "right")).to.deep.equal(["2", "1"]);
  });

  it("throws when side is unspecified for vec", () => {
    expect(() => dimensions("vec2")).to.throw("side");
  });
});

describe("same type operations", () => {
  it("checks identical types", () => {
    expect(binaryTyping("+", "float", "float")).to.equal("float");
    expect(binaryTyping("-", "int", "int")).to.be.equal("int");
    expect(binaryTyping("/", "uint", "uint")).to.be.equal("uint");
    expect(binaryTyping("*", "mat2x3", "mat2x3")).to.be.equal("mat2x3");
    expect(() => binaryTyping("*", "uint", "float")).to.throw("scalar");
    expect(() => binaryTyping("&", "int", "uint")).to.throw("scalar");
  });

  it("checks equivalent matrix types", () => {
    expect(binaryTyping("*", "mat2", "mat2x2")).to.equal("mat2");
    expect(binaryTyping("*", "mat2x2", "mat2")).to.equal("mat2");
  });
});

describe("bitwise binary operations", () => {
  it("checks valid vector and scalar operations", () => {
    expect(binaryTyping("&", "int", "ivec2")).to.equal("ivec2");
    expect(binaryTyping("|", "ivec2", "int")).to.equal("ivec2");
    expect(binaryTyping("^", "ivec2", "ivec2")).to.equal("ivec2");
    expect(binaryTyping("&", "uint", "uvec2")).to.equal("uvec2");
    expect(binaryTyping("^", "uvec2", "uint")).to.equal("uvec2");
    expect(binaryTyping("|", "uvec2", "uvec2")).to.equal("uvec2");
  });

  it("checks valid scalar and scalar operations", () => {
    expect(binaryTyping("&", "int", "int")).to.equal("int");
    expect(binaryTyping("|", "uint", "uint")).to.equal("uint");
  });

  it("throws when bitwise operators used on non-ints", () => {
    expect(() => binaryTyping("&", "int", "vec2")).to.throw("bitwise");
    expect(() => binaryTyping("|", "uvec2", "float")).to.throw("bitwise");
    expect(() => binaryTyping("^", "vec2", "vec2")).to.throw("bitwise");
    expect(() => binaryTyping("&", "float", "float")).to.throw("bitwise");
    expect(() => binaryTyping("|", "mat2", "mat2")).to.throw("bitwise");
  });
});

describe("scalar and other type operations", () => {
  it("checks floats paired with matrices", () => {
    expect(binaryTyping("+", "float", "mat2")).to.be.equal("mat2");
    expect(binaryTyping("-", "mat4x2", "float")).to.be.equal("mat4x2");
    expect(() => binaryTyping("/", "int", "mat3x3")).to.throw();
    expect(() => binaryTyping("*", "mat3x2", "uint")).to.throw();
  });

  it("checks scalars paired with vecs", () => {
    expect(binaryTyping("*", "float", "vec2")).to.be.equal("vec2");
    expect(binaryTyping("*", "vec3", "float")).to.be.equal("vec3");
    expect(binaryTyping("*", "int", "ivec2")).to.be.equal("ivec2");
    expect(binaryTyping("*", "ivec3", "int")).to.be.equal("ivec3");
    expect(binaryTyping("*", "uint", "uvec2")).to.be.equal("uvec2");
    expect(binaryTyping("*", "uvec3", "uint")).to.be.equal("uvec3");
  });

  it("checks that wrong scalar paired with wrong vec throws", () => {
    expect(() => binaryTyping("*", "int", "vec2")).to.be.throw();
    expect(() => binaryTyping("*", "mat2", "int")).to.be.throw();
  });

  it("checks to see % operations not used on floats", () => {
    expect(() => binaryTyping("%", "vec2", "float")).to.throw("mod");
    expect(() => binaryTyping("%", "float", "mat2")).to.throw("mod");
    expect(() => binaryTyping("%", "float", "int")).to.throw("mod");
    expect(binaryTyping("%", "int", "ivec2")).to.be.equal("ivec2");
    expect(binaryTyping("%", "ivec2", "int")).to.be.equal("ivec2");
    expect(binaryTyping("%", "uvec3", "uvec3")).to.be.equal("uvec3");
  });
});

describe("matrix and vector multiplications", () => {
  it("mults mat2x3 * vec2 -> vec3", () => {
    expect(binaryTyping("*", "mat2x3", "vec2")).to.equal("vec3");
  });

  it("mults vec3 * mat2x3 -> vec2", () => {
    expect(binaryTyping("*", "vec3", "mat2x3")).to.equal("vec2");
  });

  it("mults mat2x3 * mat3x2 -> mat3x3", () => {
    expect(binaryTyping("*", "mat2x3", "mat3x2")).to.equal("mat3");
  });

  it("mults mat3x2 * mat2x3 -> mat2x2", () => {
    expect(binaryTyping("*", "mat3x2", "mat2x3")).to.equal("mat2");
  });

  it("mults mat3x3 * mat3x3 -> mat3x3", () => {
    expect(binaryTyping("*", "mat3x3", "mat3x3")).to.equal("mat3");
    expect(binaryTyping("*", "mat3", "mat3")).to.equal("mat3");
  });

  it("mults mat3x2 * mat4x2 -> throws", () => {
    expect(() => binaryTyping("*", "mat3x2", "mat4x2")).to.throw("matrix");
  });

  it("mults mat2x3 * vec3 -> throws", () => {
    expect(() => binaryTyping("*", "mat2x3", "vec3")).to.throw("matrix");
  });

  it("mults vec2 * mat2x3 -> throws", () => {
    expect(() => binaryTyping("*", "vec2", "mat2x3")).to.throw("matrix");
  });

  it("mults vec2 * vec3 -> throws", () => {
    expect(() => binaryTyping("*", "vec2", "vec3")).to.throw("vector");
  });
});

describe("unary typing", () => {
  it("applies unary operators on valid types", () => {
    expect(unaryTyping("+", "vec2")).to.equal("vec2");
    expect(unaryTyping("-", "int")).to.equal("int");
    expect(unaryTyping("++", "mat2")).to.equal("mat2");
    expect(unaryTyping("--", "uvec4")).to.equal("uvec4");
  });

  it("applies unary operators on booleans and throws", () => {
    expect(() => unaryTyping("+", "bool")).to.throw("boolean");
    expect(() => unaryTyping("-", "bvec2")).to.throw("boolean");
    expect(() => unaryTyping("++", "bvec3")).to.throw("boolean");
    expect(() => unaryTyping("--", "bvec4")).to.throw("boolean");
  });

  it("simplifies matrix types", () => {
    expect(unaryTyping("+", "mat2x2")).to.equal("mat2");
  });

  it("checks unary boolean not operator on bool", () => {
    expect(unaryTyping("!", "bool")).to.equal("bool");
  });

  it("checks unary boolean not operator throwing on non-bool", () => {
    expect(() => unaryTyping("!", "int")).to.throw("scalar booleans");
  });

  it("checks unary bitwise not operator on valid types", () => {
    expect(unaryTyping("~", "int")).to.equal("int");
    expect(unaryTyping("~", "uint")).to.equal("uint");
    expect(unaryTyping("~", "ivec2")).to.equal("ivec2");
    expect(unaryTyping("~", "uvec2")).to.equal("uvec2");
  });

  it("checks unary bitwise not operator on floating point types, throws", () => {
    expect(() => unaryTyping("~", "float")).to.throw("floating");
    expect(() => unaryTyping("~", "vec2")).to.throw("floating");
    expect(() => unaryTyping("~", "mat2")).to.throw("floating");
  });

  it("checks unary not operator", () => {
    expect(() => unaryTyping("!", "int")).to.throw("scalar booleans");
    expect(unaryTyping("!", "bool")).to.equal("bool");
  });
});

describe("relational and equality typing", () => {
  it("compares valid values", () => {
    expect(binaryTyping(">", "int", "int")).to.equal("bool");
    expect(binaryTyping("<", "float", "float")).to.equal("bool");
    expect(binaryTyping(">=", "uint", "uint")).to.equal("bool");
    expect(binaryTyping(">=", "int", "int")).to.equal("bool");
  });

  it("compares mismatching values which throws", () => {
    expect(() => binaryTyping(">", "int", "uint")).to.throw("same");
    expect(() => binaryTyping("<", "float", "int")).to.throw("same");
  });

  it("compares vectors and matrices which throws", () => {
    expect(() => binaryTyping(">", "vec2", "vec2")).to.throw("greaterThan");
    expect(() => binaryTyping("<", "mat2", "mat2")).to.throw("lessThan");
    expect(() => binaryTyping(">=", "vec3", "vec3")).to.throw(
      "greaterThanEqual"
    );
    expect(() => binaryTyping("<=", "mat3", "mat3")).to.throw("lessThanEqual");
  });

  it("compares for equality valid types", () => {
    expect(binaryTyping("==", "int", "int")).to.equal("bool");
    expect(binaryTyping("!=", "mat4x2", "mat4x2")).to.equal("bool");
  });

  it("compares for equality different types, throws", () => {
    expect(() => binaryTyping("==", "int", "float")).to.throw("equality");
    expect(() => binaryTyping("!=", "mat4x2", "mat2x4")).to.throw("equality");
  });

  it("parses and type checks comparison", () => {
    expect(extractExpr("1 < 2", true).getType(els())).to.equal("bool");
  });
});

describe("logical operators", () => {
  it("checks valid logical operations on booleans", () => {
    expect(binaryTyping("&&", "bool", "bool")).to.equal("bool");
    expect(binaryTyping("||", "bool", "bool")).to.equal("bool");
    expect(binaryTyping("^^", "bool", "bool")).to.equal("bool");
  });

  it("checks illegal logical operations on booleans", () => {
    expect(() => binaryTyping("&&", "bool", "int")).to.throw("logical");
    expect(() => binaryTyping("||", "vec2", "vec3")).to.throw("logical");
    expect(() => binaryTyping("^^", "mat4x3", "bool")).to.throw("logical");
  });
});

describe("logical operators", () => {
  it("checks that both sides are integer based", () => {
    expect(() => binaryTyping("<<", "int", "float")).to.throw(
      "signed or unsigned"
    );
    expect(() => binaryTyping(">>", "vec2", "uvec2")).to.throw(
      "signed or unsigned"
    );
  });

  it("checks if right expr is scalar if left is scalar", () => {
    expect(() => binaryTyping("<<", "int", "ivec3")).to.throw(
      "scalar if expression"
    );
    expect(binaryTyping("<<", "uint", "int")).to.equal("uint");
  });

  it("checks if right expr is scalar or same-length vec if left is vec", () => {
    expect(binaryTyping("<<", "ivec2", "int")).to.equal("ivec2");
    expect(() => binaryTyping(">>", "ivec2", "uvec3")).to.throw(
      "scalar or same-length"
    );
  });
});

describe("ternary operator", () => {
  it("checks valid ternary operations", () => {
    expect(ternaryTyping("bool", "int", "int")).to.equal("int");
  });

  it("throws when non-boolean condition expression", () => {
    expect(() => ternaryTyping("vec2", "int", "int")).to.throw(
      "condition expression"
    );
  });

  it("throws when non-matching ending expressions", () => {
    expect(() => ternaryTyping("bool", "int", "float")).to.throw(
      "ending expressions"
    );
  });

  it("simplifies matrix types", () => {
    expect(ternaryTyping("bool", "mat2x2", "mat2")).to.equal("mat2");
    expect(ternaryTyping("bool", "mat2", "mat2x2")).to.equal("mat2");
    expect(ternaryTyping("bool", "mat2x2", "mat2x2")).to.equal("mat2");
  });

  it("parses and type checks ternary", () => {
    expect(
      extractExpr("1 < 2 ? ivec2(1, 2) : ivec2(3, 4)", true).getType(els())
    ).to.equal("ivec2");
  });
});

describe("typing overloaded generic function calls", () => {
  it("checks sin", () => {
    expect(callReturnType(["float"], builtIns["sin"])).to.equal("float");
    expect(callReturnType(["vec2"], builtIns["sin"])).to.equal("vec2");
    expect(() => callReturnType(["mat2"], builtIns["sin"])).to.throw(
      "no matching"
    );
  });

  it("parses expression and checks built-in function type", () => {
    expect(extractExpr("sin(vec2(1., 2.))", true).getType(els())).to.equal(
      "vec2"
    );
  });

  it("checks clamp", () => {
    expect(
      callReturnType(["vec2", "float", "float"], builtIns["clamp"])
    ).to.equal("vec2");
    expect(
      callReturnType(["vec2", "vec2", "vec2"], builtIns["clamp"])
    ).to.equal("vec2");
    expect(callReturnType(["ivec3", "int", "int"], builtIns["clamp"])).to.equal(
      "ivec3"
    );
    expect(
      callReturnType(["ivec3", "ivec3", "ivec3"], builtIns["clamp"])
    ).to.equal("ivec3");
    expect(
      callReturnType(["uvec4", "uint", "uint"], builtIns["clamp"])
    ).to.equal("uvec4");
    expect(
      callReturnType(["uvec4", "uvec4", "uvec4"], builtIns["clamp"])
    ).to.equal("uvec4");
  });

  it("checks clamp with no matching overload, throws", () => {
    expect(() =>
      callReturnType(["vec2", "vec2", "vec3"], builtIns["clamp"])
    ).to.throw("no matching");
  });

  it("throws when has generic return type with no matching arg", () => {
    expect(() =>
      callReturnType(["int"], { params: ["genIType"], ret: "genBType" })
    ).to.throw("generic");
  });

  it("tests multiple gen types with mix", () => {
    expect(callReturnType(["vec2", "vec2", "bvec2"], builtIns["mix"])).to.equal(
      "vec2"
    );
  });

  it("array param type and return type", () => {
    expect(
      callReturnType([{ typ: "int", size: 8 }], {
        params: [{ typ: "genIType", size: 8 }],
        ret: { typ: "genIType", size: 8 },
      })
    ).to.deep.equal({ typ: "int", size: 8 });

    expect(() =>
      callReturnType([{ typ: "int", size: 16 }], {
        params: [{ typ: "genIType", size: 8 }],
        ret: { typ: "genIType", size: 8 },
      })
    ).to.throw("no matching");
  });
});

describe("typing constructor calls", () => {
  it("checks scalar conversions", () => {
    expect(callReturnType(["bool"], constructors["int"])).to.equal("int");
    expect(callReturnType(["float"], constructors["bool"])).to.equal("bool");
    expect(callReturnType(["uint"], constructors["float"])).to.equal("float");
    expect(callReturnType(["int"], constructors["uint"])).to.equal("uint");
  });

  it("checks vector constructors scalars", () => {
    expect(callReturnType(["float", "float"], constructors["vec2"])).to.equal(
      "vec2"
    );
    expect(callReturnType(["bool", "bool"], constructors["bvec2"])).to.equal(
      "bvec2"
    );
    expect(
      callReturnType(["int", "int", "int"], constructors["ivec3"])
    ).to.equal("ivec3");
    expect(
      callReturnType(["uint", "uint", "uint", "uint"], constructors["uvec4"])
    ).to.equal("uvec4");
  });

  it("checks vector constructors scalars first arg vector", () => {
    expect(callReturnType(["vec2", "float"], constructors["vec3"])).to.equal(
      "vec3"
    );
    expect(callReturnType(["uvec2", "uint"], constructors["uvec3"])).to.equal(
      "uvec3"
    );
    expect(callReturnType(["ivec3", "int"], constructors["ivec4"])).to.equal(
      "ivec4"
    );
    expect(callReturnType(["bvec3", "bool"], constructors["bvec4"])).to.equal(
      "bvec4"
    );
  });

  it("checks matrix constructors scalars", () => {
    expect(
      callReturnType(["float", "float", "float", "float"], constructors["mat2"])
    ).to.equal("mat2");
    expect(
      callReturnType(
        ["float", "float", "float", "float"],
        constructors["mat2x2"]
      )
    ).to.equal("mat2x2");
    expect(
      callReturnType(
        ["float", "float", "float", "float", "float", "float"],
        constructors["mat2x3"]
      )
    ).to.equal("mat2x3");
  });

  it("checks matrix constructors vectors", () => {
    expect(callReturnType(["vec2", "vec2"], constructors["mat2"])).to.equal(
      "mat2"
    );
    expect(callReturnType(["vec2", "vec2"], constructors["mat2x2"])).to.equal(
      "mat2x2"
    );
    expect(
      callReturnType(["vec3", "vec3", "vec3", "vec3"], constructors["mat3x4"])
    ).to.equal("mat3x4");
  });
});

describe("array constructor", () => {
  const arrayInt3: ArrayType<SpecType> = { typ: "int", size: 3 };

  it("parses and checks array constructor unspecified size", () => {
    expect(extractExpr("int[](1, 2, 3)", true).getType(els())).to.deep.equal(
      arrayInt3
    );
  });

  it("parses and checks array constructor specified size", () => {
    expect(extractExpr("int[3](1, 2, 3)", true).getType(els())).to.deep.equal(
      arrayInt3
    );
  });

  it("throws when sizes don't match", () => {
    expect(() =>
      extractExpr("int[3](1, 2, 3, 4)", true).getType(els())
    ).to.throw("size");
  });
});

describe("checks that vector access is correct", () => {
  it("access scalar with single component", () => {
    expect(vectorAccessTyping("x", "vec2", false)).to.equal("float");
    expect(vectorAccessTyping("r", "ivec2", false)).to.equal("int");
    expect(vectorAccessTyping("s", "uvec2", false)).to.equal("uint");
    expect(vectorAccessTyping("y", "bvec2", false)).to.equal("bool");
  });

  it("vec access no repeat", () => {
    expect(vectorAccessTyping("xy", "vec2", false)).to.equal("vec2");
    expect(vectorAccessTyping("rg", "uvec2", false)).to.equal("uvec2");
    expect(vectorAccessTyping("st", "bvec2", false)).to.equal("bvec2");
  });

  it("vec access repeating", () => {
    expect(vectorAccessTyping("xxyy", "ivec2", false)).to.equal("ivec4");
    expect(vectorAccessTyping("rrgg", "bvec2", false)).to.equal("bvec4");
    expect(vectorAccessTyping("sstt", "uvec2", false)).to.equal("uvec4");
  });
});

describe("invalid vector access", () => {
  it("too many components", () => {
    expect(() => vectorAccessTyping("xyzwx", "vec2", false)).to.throw(
      "too many"
    );
  });

  it("scalar access", () => {
    expect(() => vectorAccessTyping("x", "float", false)).to.throw("scalar");
  });

  it("out of bounds component access", () => {
    expect(() => vectorAccessTyping("xyz", "vec2", false)).to.throw("length 2");
  });

  it("mixed sets of components", () => {
    expect(() => vectorAccessTyping("ry", "vec2", false)).to.throw("mixed");
  });

  it("left hand contains repeats", () => {
    expect(() => vectorAccessTyping("rrg", "vec2", true)).to.throw("left");
  });
});

describe("typing a binary expression", () => {
  const vecTest = (typ: string, num: number, ending: string, comps: string) => {
    const expr =
      typ +
      num +
      "(" +
      [...new Array(num)].map(() => ending).join(", ") +
      ")." +
      comps;
    expect(extractExpr(expr, true).getType(els())).to.equal(typ + comps.length);
  };

  const totalTest = (num: number, comps: string) => {
    vecTest("vec", num, "1.", comps);
    vecTest("ivec", num, "1", comps);
    vecTest("uvec", num, "1u", comps);
    vecTest("bvec", num, "false", comps);
  };

  it(".xy is on a gvec2 is a gvec2", () => {
    totalTest(2, "xy");
  });

  it(".rg, rbg is on a gvec3 is a gvec2, gvec3", () => {
    totalTest(3, "rg");
    totalTest(3, "rgb");
  });

  it(".st, stp, stpq, is on a gvec4 is a gvec2, gvec3, gvec4", () => {
    totalTest(4, "st");
    totalTest(4, "stp");
    totalTest(4, "stpq");
  });

  it("throws when left side not a vector", () => {
    expect(() => extractExpr("(123).xy", true).getType(els())).to.throw(
      "vector"
    );
  });

  it("throws when right side not component access", () => {
    expect(() => extractExpr("vec2(1., 2.).(3)", true).getType(els())).to.throw(
      "components"
    );
  });
});

describe("subscripting type check", () => {
  it("subscripts an int array with int", () => {
    expect(extractExpr("int[](1, 2, 3)[0]", true).getType(els())).to.equal(
      "int"
    );
  });

  it("subscripts an int array with uint", () => {
    expect(extractExpr("int[](1, 2, 3)[0u]", true).getType(els())).to.equal(
      "int"
    );
  });

  it("tries to subscript with non-integer, throws", () => {
    expect(() => extractExpr("int[](1, 2, 3)[1.]", true).getType(els())).throw(
      "integer"
    );
  });

  it("subscripts vecs", () => {
    expect(extractExpr("vec3(1., 2., 3.)[0]", true).getType(els())).to.equal(
      "float"
    );
    expect(extractExpr("ivec3(1, 2, 3)[0]", true).getType(els())).to.equal(
      "int"
    );
    expect(extractExpr("uvec3(1u, 2u, 3u)[0]", true).getType(els())).to.equal(
      "uint"
    );
    expect(
      extractExpr("bvec3(false, true, false)[0]", true).getType(els())
    ).to.equal("bool");
  });

  it("tries to subscript non-array, throws", () => {
    expect(() => extractExpr("1[0]", true).getType(els())).to.throw("index");
  });

  it("subscripts an mxn mat to get of length n", () => {
    expect(
      extractExpr("mat2x3(1., 2., 3., 4., 5., 6.)[0]", true).getType(els())
    ).to.equal("vec3");
  });

  it("subscripts a matrix twice to get a scalar float", () => {
    expect(
      extractExpr("mat2x3(1., 2., 3., 4., 5., 6.)[0][0]", true).getType(els())
    ).to.equal("float");
  });
});

describe("declaration type checks", () => {
  it("parses and checks a valid assignment", () => {
    expect(extractExpr("int a = 1", true).typeCheck(els())).to.equal(undefined);
  });

  it("tries to assign float to an int and throws", () => {
    expect(() => extractExpr("int a = 1.", true).typeCheck(els())).to.throw(
      "type"
    );
  });
});

describe("for loop type check", () => {
  it("parses and checks for loop", () => {
    expect(() =>
      extractExpr("for (;;) { }", false).typeCheck(els())
    ).to.not.throw();
  });

  it("parses and checks for loop", () => {
    expect(() =>
      extractExpr("for (int i = 1; i < 3; i++) { }", false).typeCheck(els())
    ).to.not.throw();
  });
});

describe("lexical scope", () => {
  const decl = (name: string, int: number) =>
    new VarDecl(
      false,
      new TypeName(tok("int"), null),
      tok(name),
      new IntExpr(tok("" + int)),
      tok("=")
    );

  const declInner = decl("inner", 1);
  const declOuter = decl("outer", 2);

  const outerScope = new LexicalScope();
  const innerScope = new LexicalScope(outerScope);

  outerScope.addToScope(declOuter.getToken().text, declOuter);
  innerScope.addToScope(declInner.getToken().text, declInner);

  it("gets inner identifier in inner scope", () => {
    expect(innerScope.resolve("inner")).to.equal(declInner);
  });

  it("gets outer identifier in inner scope", () => {
    expect(innerScope.resolve("outer")).to.equal(declOuter);
  });

  it("gets outer identifier in outer scope", () => {
    expect(outerScope.resolve("outer")).to.equal(declOuter);
  });

  it("tries to get inner identifier in outer scope, but is undefined", () => {
    expect(outerScope.resolve("inner")).to.equal(undefined);
  });

  it("type checks inner + outer in the inner scope", () => {
    expect(extractExpr("inner + outer", true).getType(innerScope)).to.equal(
      "int"
    );
  });

  it("tries to add duplicate identifier, throws", () => {
    expect(() =>
      innerScope.addToScope(declInner.getToken().text, decl("inner", 3))
    ).to.throw('duplicate identifier "inner"');
  });
});

describe("checks function definitions and calls", () => {
  it("defines a function and uses it", () => {
    expect(() =>
      parseAndCheck(`
vec4 foo () {
  return vec4(1., 1., 1., 1.);
}

{ foo() + foo(); } -> 0`)
    ).to.not.throw();
  });

  it("calls a user defined function with wrong args, throws", () => {
    expect(() =>
      parseAndCheck(`
vec4 foo (float a, float b) {
  return vec4(a, b, a, b);
}

{ foo(.5, 1); } -> 0`)
    ).to.throw("argument 1 has wrong type");
  });
});

describe("checks procedure definitions and calls", () => {
  it("defines a procedure and uses it", () => {
    expect(() =>
      parseAndCheck(`
pr foo () {
  vec4(1., 1., 1., 1.);
}

{ @foo(); } -> 0`)
    ).to.not.throw();
  });

  it("calls a user defined function with wrong args, throws", () => {
    expect(() =>
      parseAndCheck(`
pr foo (float a, float b) {
  vec4(a, b, a, b);
}

{ @foo(.5, 1); } -> 0`)
    ).to.throw("argument 1 has wrong type");
  });
});

describe("params with same name in funcs and procs", () => {
  it("defines a procedure with duplicate params", () => {
    expect(() =>
      parseAndCheck("pr foo (int a, int a) { vec4(1., 1., 1., 1.); }")
    ).to.throw("duplicate");
  });

  it("defines a function with duplicate params", () => {
    expect(() =>
      parseAndCheck("vec4 foo (int a, int a) { return vec4(1., 1., 1., 1.); }")
    ).to.throw("duplicate");
  });
});

describe("mixing up functions and procedures", () => {
  it("defines a function, uses it as a procedure, throws", () => {
    expect(() =>
      parseAndCheck(`
vec4 foo () {
  return vec4(1., 1., 1., 1.);
}

{ @foo(); } -> 0`)
    ).to.throw("procedure");
  });

  it("defines a procedure, uses it as a function, throws", () => {
    expect(() =>
      parseAndCheck(`
pr foo () {
  vec4(1., 1., 1., 1.);
}

{ foo(); } -> 0`)
    ).to.throw("function");
  });
});

describe("checks for return statements in all branches", () => {
  it("no return statement at all, throws", () => {
    expect(() => parseAndCheck("vec4 foo () { vec4(1., 1., 1.); }")).to.throw(
      "definitely"
    );
  });

  it("does not return in if, throws", () => {
    expect(() =>
      parseAndCheck("int foo (bool b) { if (b) return 0; }")
    ).to.throw("definitely");
  });

  it("does not return in one of the branches, throws", () => {
    expect(() =>
      parseAndCheck(`
int foo (bool b) {
  if (b) {
    return 1;
  } else {
    2;
  }
}`)
    ).to.throw("definitely");
    expect(() =>
      parseAndCheck(`
int foo (bool b) {
  if (b) {
    1;
  } else {
    return 2;
  }
}`)
    ).to.throw("definitely");
  });

  it("does not return in one of the branches, throws", () => {
    expect(() =>
      parseAndCheck(`
int foo (bool b) {
  if (b) {
    return 1;
  } else {
    return 2;
  }
}`)
    ).to.not.throw();
  });

  it("returns in all branches of long else if chain", () => {
    expect(() =>
      parseAndCheck(`
int foo (bool b) {
  if (b) {
    return 1;
  } else if (b) {
    return 2;
  } else if (b) {
    return 3;
  } else {
    return 4;
  }
}`)
    ).to.not.throw();
  });

  it("returns in all branches of nested if statements", () => {
    expect(() =>
      parseAndCheck(`
int foo (bool b) {
  if (b) {
    if (b) return 1; else return 2;
  } else {
    if (b) return 1; else return 2;
  }
}`)
    ).to.not.throw();
  });

  it("does not return in all branches of nested if statements", () => {
    expect(() =>
      parseAndCheck(`
int foo (bool b) {
  if (b) {
    if (b) return 1; else return 2;
  } else {
    if (b) return 1; else 2;
  }
}`)
    ).to.throw("definitely");
  });
});

describe("const declarations", () => {
  it("assigns constructor to const", () => {
    expect(() =>
      parseAndCheck(`
vec4 foo () {
  const float a = 1.;
  const vec4 b = vec4(a, a, a, a);
  return b;
}`)
    ).to.not.throw();
  });

  it("passes non-const into constructor in const assignment, throws", () => {
    expect(() =>
      parseAndCheck(`
vec4 foo () {
  float a = 1.;
  const vec4 b = vec4(a, a, a, a);
  return b;
}`)
    ).to.throw("constant");
  });

  it("passes a const expr top def into constructor in const assign", () => {
    expect(() =>
      parseAndCheck(`
def a 1.

vec4 foo () {
  const vec4 b = vec4(a, a, a, a);
  return b;
}`)
    ).to.not.throw();
  });

  it("throws when def is non-constant", () => {
    expect(() =>
      parseAndCheck(`
float bar () {
  return 2.;
}

def a 1. + bar()

vec4 foo () {
  const vec4 b = vec4(a, a, a, a);
  return b;
}`)
    ).to.throw("constant");
  });

  it("passes a const expr top def into built-in in const assign", () => {
    expect(() =>
      parseAndCheck(`
def a 1.

float foo () {
  const float b = sin(a);
  return b;
}`)
    ).to.not.throw();
  });
});

describe("render block in procedure", () => {
  it("parses and checks simple render block no params", () => {
    expect(() =>
      parseAndCheck(`
pr foo () {
  0 -> loop 2 { vec4(1., 0., 0., 1.); } -> 1 
}

{ @foo(); }`)
    ).to.not.throw();
  });

  it("parses and checks simple render block params", () => {
    expect(() =>
      parseAndCheck(`
pr foo (int in_num, int out_num, int loop_num) {
  in_num -> loop loop_num { vec4(1., 0., 0., 1.); } -> out_num
}

{ @foo(0, 1, 2); }`)
    ).to.not.throw();
  });

  it("throws because param is not atomic int", () => {
    const atomicParamSource = (str: string) => `
pr foo (int in_num, int out_num, int loop_num) {
  in_num -> loop loop_num { vec4(1., 0., 0., 1.); } -> out_num
}

{ @foo(${str}); }`;

    expect(() => parseAndCheck(atomicParamSource("0 * 42, 1, 2"))).to.throw(
      '"in_num" is not a compile time'
    );
    expect(() => parseAndCheck(atomicParamSource("0, 1 * 1, 2"))).to.throw(
      '"out_num" is not a compile time'
    );
    expect(() => parseAndCheck(atomicParamSource("0, 1, 1+1"))).to.throw(
      '"loop_num" is not a compile time'
    );
  });

  it("throws when render block outside proc is not compile time", () => {
    expect(() =>
      parseAndCheck("(0 + 0) -> loop 2 { vec4(1., 2., 3., 4.); } -> 1")
    ).to.throw("source texture");
    expect(() =>
      parseAndCheck("0 -> loop 1 + 1 { vec4(1., 2., 3., 4.); } -> 1")
    ).to.throw("loop");
    expect(() =>
      parseAndCheck("0 -> loop 2 { vec4(1., 2., 3., 4.); } -> 2 - 1")
    ).to.throw("destination texture");
  });

  it("parses and checks simple render block params", () => {
    expect(() =>
      parseAndCheck(`
def in_num 0
def out_num 1
def loop_num 2

in_num -> loop loop_num { vec4(1., 0., 0., 1.); } -> out_num
`)
    ).to.not.throw();
  });
});

describe("array return type of function", () => {
  it("returning a correct array", () => {
    expect(() =>
      parseAndCheck(`
int[5] foo () {
  return int[](1, 2, 3, 4, 5);
}`)
    ).to.not.throw();
  });

  it("size of return type is unspecified, throws", () => {
    expect(() =>
      parseAndCheck(`
int[] foo () {
  return int[](1, 2, 3, 4, 5);
}`)
    ).to.throw("size");
  });
});

describe("parses and checks assignments", () => {
  it("performs simple reassignment", () => {
    expect(() =>
      parseAndCheck(`
int foo () {
  int a = 1;
  a = 2;
  return a;
}`)
    ).to.not.throw();
  });

  it("tries to assign entire const array", () => {
    expect(() =>
      parseAndCheck(`
int[5] foo () {
  const int[] a = int[](1, 2, 3, 4, 5);
  a = int[](6, 7, 8, 9, 10);
  return a;
}`)
    ).to.throw("constant");
  });

  it("assigns to element in non-constant array", () => {
    expect(() =>
      parseAndCheck(`
int foo () {
  int[] arr = int[](1, 2, 3, 4, 5);
  arr[0] = 99;
  return arr[0];
}`)
    ).to.not.throw();
  });

  it("tries to assign to element of const array, throws", () => {
    expect(() =>
      parseAndCheck(`
int foo () {
  const int[] arr = int[](1, 2, 3, 4, 5);
  arr[0] = 99;
  return arr[0];
}`)
    ).to.throw("constant");
  });

  it("assigns to component in vec with dot notation", () => {
    expect(() =>
      parseAndCheck(`
int foo () {
  ivec3 v = ivec3(1, 2, 3);
  v.x = 4;
  return v.x;
}`)
    ).to.not.throw();
  });

  const subscriptSource = (constant: boolean, index: string) => `int foo () {
  ${constant ? "const " : ""}ivec3 v = ivec3(1, 2, 3);
  v${index} = 4;
  return v${index};
}`;

  it("assigns to component in vec with square bracket", () => {
    expect(() => parseAndCheck(subscriptSource(false, "[0]"))).to.not.throw();
  });

  it("assigns to component in vec with dot notation", () => {
    expect(() => parseAndCheck(subscriptSource(false, ".x"))).to.not.throw();
  });

  it("assigns to component in const vec with square bracket, throws", () => {
    expect(() => parseAndCheck(subscriptSource(true, "[0]"))).to.throw(
      "constant"
    );
  });

  it("assigns to component in const vec with dot notation, throws", () => {
    expect(() => parseAndCheck(subscriptSource(true, ".x"))).to.throw(
      "constant"
    );
  });

  it("throws when trying to assign to def", () => {
    expect(() =>
      parseAndCheck(`
def a 1

int foo () {
  a = 2;
  return a;
}`)
    ).to.throw("l-value");
  });
});

describe("parses and type decl type inference", () => {
  it("declares and uses variable with :=", () => {
    expect(() =>
      parseAndCheck(`
int foo () {
  a := 1;
  a = 2;
  return a;
}`)
    ).to.not.throw();
  });

  it("declares variable with := and assigns to wrong type, throws", () => {
    expect(() =>
      parseAndCheck(`
int foo () {
  a := 1;
  a = 2.;
  return a;
}`)
    ).to.throw("assignment was int");
  });

  it("declares const variable with := and tries to assign, throws", () => {
    expect(() =>
      parseAndCheck(`
int foo () {
  const a := 1;
  a = 2;
  return a;
}`)
    ).to.throw("constant");
  });
});

describe("function return type inference", () => {
  it("uses function with inferred return type", () => {
    expect(() =>
      parseAndCheck(`
def output_num 0

fn foo (int num) {
  if (num == 1) return vec4(1., 0., 0., 1.);
  else return vec4(0., 0., 0., 1.);
}

fn bar () {
  a := vec4(1., 2., 3., 4.);
  a += foo(1);
  return a;
}

{ bar(); } -> output_num`)
    ).to.not.throw();
  });

  it("uses function with inferred return type", () => {
    expect(() =>
      parseAndCheck(`
fn returns1 () {
  return int[](1);
}

fn returns2 () {
  return int[2](returns1()[0], 2);
}

int[2] foo () {
  a := returns2();
  return a;
}`)
    ).to.not.throw();
  });
});

describe("frag typing tests", () => {
  it("calls frag with both pos and sampler num", () => {
    expect(() =>
      parseAndCheck("vec4 foo () { return frag(0, vec2(.5, 5.)); } ")
    ).to.not.throw();
  });

  it("calls frag with just sampler num", () => {
    expect(() =>
      parseAndCheck("vec4 foo () { return frag(0); } ")
    ).to.not.throw();
  });

  it("calls frag with just pos", () => {
    expect(() =>
      parseAndCheck("vec4 foo () { return frag(vec2(.5, .5)); } ")
    ).to.not.throw();
  });

  it("calls frag with incorrect args", () => {
    expect(() => parseAndCheck("vec4 foo () { return frag(1, 1); } ")).to.throw(
      "one int"
    );
    expect(() =>
      parseAndCheck("vec4 foo () { v := vec2(.5, 5.); return frag(v, v); } ")
    ).to.throw("one vec2");
  });

  it("passes non compile time atomic into into sampler and throws", () => {
    expect(() =>
      parseAndCheck("vec4 foo () { return frag(0 + 0); } ")
    ).to.throw("compile time");
  });

  it("tries to call frag with no arguments, throws", () => {
    expect(() => parseAndCheck("vec4 foo () { return frag(); } ")).to.throw(
      "no arguments"
    );
  });
});

describe("typing for built in values", () => {
  it("types pos", () => {
    expect(extractExpr("pos", true).getType(els())).to.equal("vec2");
  });

  it("types res", () => {
    expect(extractExpr("res", true).getType(els())).to.equal("vec2");
  });

  it("types time", () => {
    expect(extractExpr("time", true).getType(els())).to.equal("float");
  });
});

// TODO should params be in the same scope as one another? defaults might
// reorder them when compiling (might not matter because assignments not
// allowed and no side effects)

// TODO accessing components of a matrix?
