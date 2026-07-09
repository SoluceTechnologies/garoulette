import { Draw, Prize, Settings } from "./schemas/campaign.schema";

export type Campaign = {
  slug: string;
  settings: Settings;
  prizes: Prize[];
  draws: Draw[];
};
