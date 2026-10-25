import type { Metadata } from "next";
import { SimpleView } from "@/components/simple/SimpleView";

export const metadata: Metadata = { title: "Simple mode" };

export default function SimplePage() {
  return <SimpleView />;
}
