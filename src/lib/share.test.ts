import { describe, expect, it } from "vitest";
import { combineShared } from "./share";

describe("combineShared", () => {
  it("joins title, text and url on separate lines", () => {
    expect(combineShared({ title: "Alert", text: "Pay now", url: "https://a.example" })).toBe("Alert\nPay now\nhttps://a.example");
  });
  it("skips blanks and fields already contained in another", () => {
    expect(combineShared({ title: "", text: "Pay at https://a.example", url: "https://a.example" })).toBe("Pay at https://a.example");
  });
  it("returns an empty string when nothing was shared", () => {
    expect(combineShared({ title: " ", text: "", url: "" })).toBe("");
  });
});
