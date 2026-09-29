import { describe, expect, it } from "vitest";
import { bn, en } from "@rescue-alert/localization";
import {
  INCIDENT_LABELS,
  INCIDENT_LABEL_KEYS,
  renderNotification,
  type Locale,
  type NotificationCategory,
} from "../messages.ts";

const CATEGORIES: NotificationCategory[] = [
  "new_critical_case_nearby",
  "new_urgent_case_nearby",
  "radius_expanded_case",
  "response_accepted_or_changed",
  "official_case_update",
  "reply_or_mention",
  "case_status_changed",
  "case_closed",
  "follow_up_requested",
  "moderation_or_account",
];

describe("incident labels", () => {
  it("match the app catalogs exactly, in both languages", () => {
    expect(INCIDENT_LABEL_KEYS).toHaveLength(16);
    for (const key of INCIDENT_LABEL_KEYS) {
      const catalogKey = `incident_${key}` as keyof typeof en;
      expect(INCIDENT_LABELS.en[key as keyof typeof INCIDENT_LABELS.en]).toBe(
        en[catalogKey],
      );
      expect(INCIDENT_LABELS.bn[key as keyof typeof INCIDENT_LABELS.bn]).toBe(
        bn[catalogKey],
      );
    }
  });
});

describe("renderNotification", () => {
  const nearby = {
    incident_type: "injured_animal",
    urgency: "critical",
    area: "Dhanmondi",
    distance_km: 2.4,
  };

  it("renders the PRD 11.2 example shape in English", () => {
    const { title, body } = renderNotification(
      "en",
      "new_critical_case_nearby",
      nearby,
    );
    expect(title).toBe("Critical: Injured animal reported 2.4 km away");
    expect(body).toBe(
      "Near Dhanmondi. Open Rescue Alert to see how you can help.",
    );
  });

  it("renders in Bengali with Bengali digits", () => {
    const { title, body } = renderNotification(
      "bn",
      "new_critical_case_nearby",
      nearby,
    );
    expect(title).toContain("আহত প্রাণী");
    expect(title).toContain("২.৪");
    expect(title).toContain("সংকটাপন্ন");
    expect(body).toContain("Dhanmondi");
  });

  it("marks a radius-expanded alert as still needing help", () => {
    const { title } = renderNotification("en", "radius_expanded_case", nearby);
    expect(title).toBe(
      "Critical: Injured animal still needs help, 2.4 km away",
    );
  });

  it("omits the area sentence when there is no area", () => {
    const { body } = renderNotification("en", "new_urgent_case_nearby", {
      ...nearby,
      urgency: "urgent",
      area: null,
    });
    expect(body).toBe("Open Rescue Alert to see how you can help.");
  });

  it("renders every category in both languages with no empty text", () => {
    for (const locale of ["en", "bn"] as Locale[]) {
      for (const category of CATEGORIES) {
        const { title, body } = renderNotification(locale, category, nearby);
        expect(title.length).toBeGreaterThan(0);
        expect(body.length).toBeGreaterThan(0);
        expect(`${title}${body}`).not.toContain("undefined");
      }
    }
  });

  it("groups repeated updates into one count title", () => {
    const { title } = renderNotification("en", "official_case_update", {
      incident_type: "injured_animal",
      count: 3,
    });
    expect(title).toBe("3 new updates");
    expect(
      renderNotification("bn", "official_case_update", { count: 3 }).title,
    ).toBe("৩টি নতুন আপডেট");
  });

  it("falls back to a generic label for an unknown incident type", () => {
    const { body } = renderNotification("en", "case_closed", {
      incident_type: "made_up",
    });
    expect(body).toBe("Your case has been closed.");
  });
});
