import { describe, expect, it } from "vitest"
import { markdownToPlainText } from "./markdown"

describe("markdownToPlainText", () => {
  it("returns an empty string for nothing", () => {
    expect(markdownToPlainText(null)).toBe("")
    expect(markdownToPlainText("")).toBe("")
  })

  it("leaves plain text alone", () => {
    expect(markdownToPlainText("A simple description.")).toBe("A simple description.")
  })

  it("strips headings, emphasis, lists and quotes onto one line", () => {
    const markdown = "# Title\n\nSome **bold** and *italic* and ~~old~~ text.\n\n- one\n- two\n\n1. first\n\n> quoted"

    expect(markdownToPlainText(markdown)).toBe("Title Some bold and italic and old text. one two first quoted")
  })

  it("keeps link text and code contents", () => {
    expect(markdownToPlainText("See [the guide](https://example.org) and `run()`.")).toBe("See the guide and run().")
    expect(markdownToPlainText("```js\nconst a = 1\n```")).toBe("const a = 1")
  })

  it("does not eat underscores or asterisks inside words", () => {
    expect(markdownToPlainText("snake_case_name and 2*3*4")).toBe("snake_case_name and 2*3*4")
  })
})
