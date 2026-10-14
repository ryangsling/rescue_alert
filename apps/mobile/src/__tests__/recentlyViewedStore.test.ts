import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  listRecentlyViewedCases,
  recordCaseView,
} from "../recentlyViewedStore";

describe("recentlyViewedStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns an empty list when nothing has been viewed", async () => {
    expect(await listRecentlyViewedCases()).toEqual([]);
  });

  it("records a view and lists it most-recent first", async () => {
    await recordCaseView({
      id: "case-1",
      publicReference: "RA-AAA11111",
      title: "Injured dog",
      urgency: "urgent",
    });
    await recordCaseView({
      id: "case-2",
      publicReference: "RA-BBB22222",
      title: "Trapped cat",
      urgency: "critical",
    });

    const list = await listRecentlyViewedCases();
    expect(list.map((c) => c.id)).toEqual(["case-2", "case-1"]);
    expect(list[0].viewedAt).toBeTruthy();
  });

  it("moves a re-viewed case to the front instead of duplicating it", async () => {
    await recordCaseView({
      id: "case-1",
      publicReference: "RA-AAA11111",
      title: "Injured dog",
      urgency: "urgent",
    });
    await recordCaseView({
      id: "case-2",
      publicReference: "RA-BBB22222",
      title: "Trapped cat",
      urgency: "critical",
    });
    await recordCaseView({
      id: "case-1",
      publicReference: "RA-AAA11111",
      title: "Injured dog",
      urgency: "urgent",
    });

    const list = await listRecentlyViewedCases();
    expect(list.map((c) => c.id)).toEqual(["case-1", "case-2"]);
  });

  it("keeps only the ten most recently viewed cases", async () => {
    for (let i = 0; i < 12; i++) {
      await recordCaseView({
        id: `case-${i}`,
        publicReference: `RA-${i}`,
        title: `Case ${i}`,
        urgency: "support_needed",
      });
    }

    const list = await listRecentlyViewedCases();
    expect(list).toHaveLength(10);
    expect(list[0].id).toBe("case-11");
  });
});
