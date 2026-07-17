export interface StageDistributionOptions {
  repoRoot?: string;
  outputDir: string;
  releaseTag: string;
}

export interface StagedDistribution {
  version: string;
  releaseTag: string;
  localMarketplaceRoot: string;
  remoteMarketplacePath: string;
  manifestPath: string;
}

export function renderLocalMarketplace(): Record<string, unknown>;
export function renderRemoteMarketplace(releaseTag: string): Record<string, unknown>;
export function stageDistribution(
  options: StageDistributionOptions,
): Promise<StagedDistribution>;
