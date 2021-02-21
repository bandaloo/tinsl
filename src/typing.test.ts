import chai, { expect } from "chai";
import { dimensions, operators } from "./typing";

describe("regex on vec and mat dimensions", () => {
  it("matches matmxn", () => {
    expect(dimensions("mat2x3")).to.deep.equal(["3", "2"]);
  });

  it("matches matmxn", () => {
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

describe("mat * mat, vec * mat and mat * vec multiplications", () => {
  it("mults mat2x3 * vec2 -> vec3", () => {
    expect(operators("*", "mat2x3", "vec2")).to.equal("vec3");
  });

  it("mults vec3 * mat2x3 -> vec2", () => {
    expect(operators("*", "vec3", "mat2x3")).to.equal("vec2");
  });

  it("mults mat2x3 * mat3x2 -> mat3x3", () => {
    expect(operators("*", "mat2x3", "mat3x2")).to.equal("mat3x3");
  });

  it("mults mat3x2 * mat2x3 -> mat2x2", () => {
    expect(operators("*", "mat3x2", "mat2x3")).to.equal("mat2x2");
  });

  it("mults mat3x3 * mat3x3 -> mat3x3", () => {
    expect(operators("*", "mat3x3", "mat3x3")).to.equal("mat3x3");
    expect(operators("*", "mat3", "mat3")).to.equal("mat3x3");
  });
});
