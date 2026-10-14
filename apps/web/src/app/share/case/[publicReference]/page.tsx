import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublicCaseDetail,
  getPublicMediaSignedUrl,
} from "@rescue-alert/api";
import { translate } from "@rescue-alert/localization";
import { createClient } from "../../../../lib/supabase/server";
import { PublicCaseView, type PublicCaseDetail } from "./public-case-view";

type Props = { params: Promise<{ publicReference: string }> };

async function loadDetail(publicReference: string) {
  const supabase = await createClient();
  const { data } = await getPublicCaseDetail(supabase, publicReference);
  return data as PublicCaseDetail | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicReference } = await params;
  const detail = await loadDetail(publicReference);
  if (!detail) {
    return { title: "Case not found - Rescue Alert" };
  }

  const incidentLabel = translate(
    "en",
    `incident_${detail.incident_type}` as Parameters<typeof translate>[1],
  );
  const title = `${incidentLabel} - Rescue Alert`;
  const description = `${detail.division ?? ""} ${detail.district ?? ""}${
    detail.last_official_update ? ` - ${detail.last_official_update}` : ""
  }`.trim();

  let ogImage: string | undefined;
  if (detail.media[0]) {
    const supabase = await createClient();
    const { data } = await getPublicMediaSignedUrl(
      supabase,
      detail.media[0].storage_path,
    );
    ogImage = data?.signedUrl;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PublicCasePage({ params }: Props) {
  const { publicReference } = await params;
  const detail = await loadDetail(publicReference);
  if (!detail) {
    notFound();
  }

  const supabase = await createClient();
  const mediaUrls = await Promise.all(
    detail.media.map(async (m) => {
      const { data } = await getPublicMediaSignedUrl(supabase, m.storage_path);
      return data?.signedUrl ?? null;
    }),
  );

  return <PublicCaseView detail={detail} mediaUrls={mediaUrls} />;
}
