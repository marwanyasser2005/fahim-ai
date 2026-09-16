import { describe, expect, it } from "vitest";
import { KNOWN_ROLES, resolveProfileRole, staffRoles } from "../src/lib/roleResolution";

describe("profile role resolution", () => {
  it("falls back to student when no role key is recognised", () => {
    expect(resolveProfileRole([])).toBe("student");
    expect(resolveProfileRole(["owner", "teacher", ""])).toBe("student");
  });

  it("returns the strongest role when an account holds several", () => {
    expect(resolveProfileRole(["student", "admin"])).toBe("admin");
    expect(resolveProfileRole(["moderator", "instructor"])).toBe("moderator");
    expect(resolveProfileRole(["student"])).toBe("student");
  });

  it("only treats seeded database role keys as known roles", () => {
    expect(KNOWN_ROLES).toEqual(["student", "instructor", "moderator", "admin"]);
  });

  it("treats every seeded non-student role as staff and student as non-staff", () => {
    expect(staffRoles).not.toContain("student");
    for (const role of KNOWN_ROLES.filter((entry) => entry !== "student")) {
      expect(staffRoles).toContain(role);
    }
  });

  it("never trusts a client-supplied role key that the database does not seed", () => {
    // Guards the regression where staff navigation was gated on `profiles.role`,
    // a column that no migration creates.
    expect(resolveProfileRole(["teacher"])).toBe("student");
    expect(resolveProfileRole(["superadmin"])).toBe("student");
  });
});
