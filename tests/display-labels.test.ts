import { describe, expect, it } from "vitest";
import { displayLabel, evidenceLabels } from "../src/lib/displayLabels";

describe("product-facing labels", () => {
  it("localizes evidence enums without exposing snake case", () => {
    expect(displayLabel("VERIFIED_SOURCE", "ar")).toBe("موثّق بمصدر");
    expect(displayLabel("VERIFIED_SOURCE", "en")).toBe("Verified source");
    expect(displayLabel("NEEDS_REVIEW", "ar")).toBe("يحتاج مراجعة");
  });

  it("keeps all evidence contract labels human-readable", () => {
    for (const language of ["ar", "en"] as const) {
      for (const item of evidenceLabels(language)) {
        expect(item.label).not.toMatch(/_/);
        expect(item.label.length).toBeGreaterThan(3);
      }
    }
  });

  it("humanizes unknown provider values safely", () => {
    expect(displayLabel("curriculum_registry", "en")).toBe(
      "Curriculum Registry",
    );
    expect(displayLabel("curriculum_registry", "ar")).toBe(
      "curriculum registry",
    );
  });
});
