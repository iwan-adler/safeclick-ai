import type { Metadata } from "next";
import { ExamplesView } from "@/components/examples/ExamplesView";

export const metadata: Metadata = { title: "Examples" };

export default function ExamplesPage() {
  return <ExamplesView />;
}
