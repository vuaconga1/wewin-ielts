import type {
  HubBranch,
  HubPlacementItem,
} from "@/lib/hub/placement-attempts-types";

export type AggregatedPlacementSource = "ielts" | "cambridge";

export type AggregatedPlacementItem = HubPlacementItem & {
  source: AggregatedPlacementSource;
};

export type AggregatedPlacementResult = {
  generatedAt: string;
  items: AggregatedPlacementItem[];
  stats: {
    total: number;
    byBranch: Record<HubBranch, number>;
    bySource: Record<AggregatedPlacementSource, number>;
  };
  sources: {
    ielts: { ok: boolean; error?: string };
    cambridge: { ok: boolean; error?: string };
  };
};
