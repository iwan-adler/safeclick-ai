import type { Metadata } from "next";
import { GuideView } from "@/components/guide/GuideView";

export const metadata: Metadata = { title: "Safety Guide" };

export default function GuidePage() {
  return <GuideView />;
}
