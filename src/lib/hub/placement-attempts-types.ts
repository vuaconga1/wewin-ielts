export type HubBranch = "NTL" | "XVNT";

export type HubPlacementItem = {
  id: string;
  externalId: string;
  studentName: string;
  branch: HubBranch;
  testLabel: string;
  testSlug: string;
  finishedAt: string;
  scoreCorrect: number | null;
  scoreTotal: number | null;
  scorePercent: number | null;
  detailUrl: string;
};

export type HubPlacementListResult = {
  source: "ielts";
  generatedAt: string;
  items: HubPlacementItem[];
  stats: {
    total: number;
    byBranch: Record<HubBranch, number>;
  };
};

export type HubPlacementFilters = {
  q?: string;
  branch?: HubBranch;
  test?: string;
  from?: string;
  to?: string;
  take?: number;
};
