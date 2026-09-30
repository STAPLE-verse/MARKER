import { describe, expect, it } from "vitest"
import {
  PUBLICATION_DOMAIN_OPTIONS,
  PUBLICATION_LANGUAGE_OPTIONS,
  domainLabel,
  languageLabel,
  normalizeDomainValue,
} from "./publicationMetadataOptions"

describe("publication domain options", () => {
  it("is the 42 OECD fields, stored by unique code", () => {
    const values = PUBLICATION_DOMAIN_OPTIONS.map((option) => option.value)

    expect(values).toHaveLength(42)
    expect(new Set(values).size).toBe(42)
    expect(values.every((value) => /^[1-6]\.\d{1,2}$/.test(value))).toBe(true)
  })

  it("shows the readable name for a code", () => {
    expect(domainLabel("5.1")).toBe("Psychology")
    expect(domainLabel("1.2")).toBe("Computer and information sciences")
  })

  it("reads domains stored the old way as their OECD field", () => {
    expect(normalizeDomainValue("psychology")).toBe("5.1")
    expect(normalizeDomainValue("economics")).toBe("5.2")
    expect(domainLabel("sociology")).toBe("Sociology")
    expect(domainLabel("economics")).toBe("Economics and business")
  })

  it("keeps a label for the retired non-OECD domain without remapping it", () => {
    expect(normalizeDomainValue("neuroscience")).toBe("neuroscience")
    expect(domainLabel("neuroscience")).toBe("Neuroscience")
  })

  it("leaves empty and unknown values alone", () => {
    expect(normalizeDomainValue(null)).toBeNull()
    expect(normalizeDomainValue("5.1")).toBe("5.1")
    expect(domainLabel(null)).toBe("Not specified")
    expect(domainLabel("something-else")).toBe("something-else")
  })
})

describe("publication language options", () => {
  it("has one entry per code, with no regional variants", () => {
    const values = PUBLICATION_LANGUAGE_OPTIONS.map((option) => option.value)

    expect(new Set(values).size).toBe(values.length)
    expect(values.every((value) => /^[a-z]{2}$/.test(value))).toBe(true)
    expect(languageLabel("en")).toBe("English")
  })

  it("still labels the retired English (UK) value", () => {
    expect(languageLabel("en-gb")).toBe("English (UK)")
  })
})
