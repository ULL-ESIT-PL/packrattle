import { Line, SourceSpan, Span } from "../";

import "should";
import "source-map-support/register";

describe("SourceSpan", () => {
  const text = "line one\nline two\nline 3\n\nline 4";

  function span(start: number, end: number): SourceSpan {
    return new SourceSpan(text, new Span(start, end));
  }

  function verify(line: Line, lineno: number, xpos: number) {
    const lines = text.split("\n");
    line.lineNumber.should.eql(lineno);
    line.xpos.should.eql(xpos);
    text.slice(line.startOfLine, line.endOfLine).should.eql(lines[line.lineNumber]);
  }

  it("finds the current line", () => {
    verify(span(0, 1).startLine, 0, 0);
    verify(span(5, 6).startLine, 0, 5);
    verify(span(7, 8).startLine, 0, 7);
    verify(span(8, 9).startLine, 0, 8);
    verify(span(9, 10).startLine, 1, 0);
    verify(span(20, 21).startLine, 2, 2);
    verify(span(25, 26).startLine, 3, 0);
    verify(span(26, 27).startLine, 4, 0);
    verify(span(31, 32).startLine, 4, 5);
  });

  it("can make squiggles", () => {
    span(5, 8).toSquiggles().should.eql([ "line one", "     ~~~" ]);
    span(27, 28).toSquiggles().should.eql([ "line 4", " ~" ]);
  });

  it("can find text around", () => {
    span(5, 6).around(2).should.eql("e [o]ne");
    span(0, 1).around(2).should.eql("[l]in");
    span(7, 8).around(2).should.eql("on[e]");
    span(10, 11).around(4).should.eql("l[i]ne t");
  });
});
