import { afterEach, describe, expect, it } from "vitest";
import { getNewsRisk } from "@/lib/news/news-risk";

const originalFlag = process.env.NEWS_RISK_FLAG;
const originalMode = process.env.NEWS_RISK_MODE;
const originalNote = process.env.NEWS_RISK_NOTE;

afterEach(() => {
  process.env.NEWS_RISK_FLAG = originalFlag;
  process.env.NEWS_RISK_MODE = originalMode;
  process.env.NEWS_RISK_NOTE = originalNote;
});

describe("getNewsRisk", () => {
  it("forces risk when manual flag is active", async () => {
    process.env.NEWS_RISK_MODE = "auto";
    process.env.NEWS_RISK_FLAG = "true";
    process.env.NEWS_RISK_NOTE = "Offering risk";

    await expect(getNewsRisk()).resolves.toEqual({
      clean: false,
      note: "Offering risk",
    });
  });
});
