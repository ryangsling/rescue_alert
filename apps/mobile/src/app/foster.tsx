import { useCallback, useEffect, useState } from "react";
import {
  Banner,
  Button,
  Checkbox,
  LoadingState,
  SafeAreaContainer,
  Stack,
  Text,
  TextArea,
  TextField,
} from "@rescue-alert/ui";
import {
  createFosterProfile,
  updateFosterProfile,
  getMyFosterProfile,
  listPlacementRequestsForFoster,
  respondToPlacementRequest,
  getProfileNames,
} from "@rescue-alert/api";
import { fosterProfileSchema } from "@rescue-alert/validation";
import {
  translate,
  useLocale,
  type TranslationKey,
} from "@rescue-alert/localization";
import type { Database } from "@rescue-alert/types";
import { supabase } from "../supabase-client";

type FosterProfileRow = Database["public"]["Tables"]["foster_profiles"]["Row"];
type PlacementRequestRow =
  Database["public"]["Tables"]["foster_placement_requests"]["Row"];

const STATUS_LABEL_KEY: Record<PlacementRequestRow["status"], TranslationKey> =
  {
    pending: "placement_request_status_pending",
    approved: "placement_request_status_approved",
    declined: "placement_request_status_declined",
    withdrawn: "placement_request_status_withdrawn",
  };

export default function FosterProfileScreen() {
  const { locale } = useLocale();
  const t = (key: TranslationKey) => translate(locale, key);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<FosterProfileRow | null>(null);
  const [requests, setRequests] = useState<PlacementRequestRow[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [capacity, setCapacity] = useState("1");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [limitations, setLimitations] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setLoading(false);
      return;
    }

    const { data: existing } = await getMyFosterProfile(supabase, uid);
    if (existing) {
      setProfile(existing);
      setCapacity(String(existing.capacity));
      setArea(existing.area ?? "");
      setAddress(existing.address ?? "");
      setAvailableFrom(existing.available_from ?? "");
      setAvailableUntil(existing.available_until ?? "");
      setLimitations(existing.limitations ?? "");
      setIsActive(existing.is_active);

      const { data: reqs } = await listPlacementRequestsForFoster(
        supabase,
        existing.id,
      );
      setRequests(reqs ?? []);
      setProfileNames(
        await getProfileNames(
          supabase,
          (reqs ?? []).map((r) => r.requested_by),
        ),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  async function handleSave() {
    if (!userId) return;
    setError(null);

    const result = fosterProfileSchema.safeParse({
      capacity: parseInt(capacity, 10) || 0,
      area: area || undefined,
      address: address || undefined,
      availableFrom: availableFrom || undefined,
      availableUntil: availableUntil || undefined,
      limitations: limitations || undefined,
      isActive,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid foster profile");
      return;
    }

    setSaving(true);
    if (profile) {
      await updateFosterProfile(supabase, profile.id, result.data);
    } else {
      await createFosterProfile(supabase, userId, result.data);
    }
    setSaving(false);
    await loadAll();
  }

  async function handleRespond(
    requestId: string,
    decision: "approved" | "declined",
  ) {
    if (!userId) return;
    await respondToPlacementRequest(supabase, userId, requestId, decision);
    await loadAll();
  }

  if (loading) {
    return (
      <SafeAreaContainer>
        <LoadingState />
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer>
      <Stack gap="6" className="flex-1 p-6">
        <Text variant="heading1">{t("foster_profile_heading")}</Text>

        <TextField
          label={t("foster_capacity_label")}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
        />
        <TextField
          label={t("foster_area_label")}
          value={area}
          onChangeText={setArea}
        />
        <TextField
          label={t("foster_address_label")}
          value={address}
          onChangeText={setAddress}
        />
        <TextField
          label={t("foster_available_from_label")}
          value={availableFrom}
          onChangeText={setAvailableFrom}
          placeholder="YYYY-MM-DD"
        />
        <TextField
          label={t("foster_available_until_label")}
          value={availableUntil}
          onChangeText={setAvailableUntil}
          placeholder="YYYY-MM-DD"
        />
        <TextArea
          label={t("foster_limitations_label")}
          value={limitations}
          onChangeText={setLimitations}
          rows={3}
        />
        <Checkbox
          label={t("foster_active_toggle_label")}
          checked={isActive}
          onChange={setIsActive}
        />

        {error ? <Banner tone="critical" message={error} /> : null}

        <Button loading={saving} onPress={handleSave}>
          {t("foster_save_action")}
        </Button>

        {profile ? (
          <Stack gap="2">
            <Text variant="titleMedium">
              {t("foster_incoming_requests_heading")}
            </Text>
            {requests.map((request) => (
              <Stack
                key={request.id}
                gap="2"
                className="rounded-medium border border-border p-3"
              >
                <Text>
                  {profileNames[request.requested_by] ?? request.requested_by}
                </Text>
                <Text tone="muted">{t(STATUS_LABEL_KEY[request.status])}</Text>
                {request.status === "pending" ? (
                  <Stack direction="row" gap="2">
                    <Button
                      variant="outline"
                      onPress={() => handleRespond(request.id, "approved")}
                    >
                      {t("foster_request_approve_action")}
                    </Button>
                    <Button
                      variant="outline"
                      onPress={() => handleRespond(request.id, "declined")}
                    >
                      {t("foster_request_decline_action")}
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </SafeAreaContainer>
  );
}
