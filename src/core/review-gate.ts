import { randomUUID } from "node:crypto";
import type { ReviewItem, ReviewItemKind } from "./types";
import { getReviewInboxPath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

interface ReviewItemInput {
  kind: ReviewItemKind;
  sessionId: string;
  proposedChange: string;
  sourceRefs: string[];
  reason: string;
  riskLevel: ReviewItem["riskLevel"];
  defaultAction: ReviewItem["defaultAction"];
}

export class ReviewGate {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async readInbox(): Promise<ReviewItem[]> {
    return await this.coordinator.readJson<ReviewItem[]>(getReviewInboxPath(this.repoPath), []);
  }

  async addReviewItem(input: ReviewItemInput): Promise<ReviewItem> {
    let selected: ReviewItem | undefined;
    await this.coordinator.updateJson<ReviewItem[]>(getReviewInboxPath(this.repoPath), [], (inbox) => {
      const existing = inbox.find((item) => item.proposedChange === input.proposedChange && item.kind === input.kind);
      if (existing) {
        selected = existing;
        return inbox;
      }
      const item: ReviewItem = {
        id: `review-${randomUUID()}`,
        createdAt: new Date().toISOString(),
        status: "pending",
        ...input,
      };
      selected = item;
      return [...inbox, item];
    });
    if (!selected) throw new Error("Review item was not created");
    return selected;
  }

  async accept(id: string): Promise<ReviewItem> {
    return await this.updateStatus(id, "accepted");
  }

  async reject(id: string): Promise<ReviewItem> {
    return await this.updateStatus(id, "rejected");
  }

  async edit(id: string, proposedChange: string): Promise<ReviewItem> {
    let updated: ReviewItem | undefined;
    await this.coordinator.updateJson<ReviewItem[]>(getReviewInboxPath(this.repoPath), [], (inbox) => {
      const existing = inbox.find((item) => item.id === id);
      if (!existing) throw new Error(`Review item not found: ${id}`);
      updated = { ...existing, proposedChange, status: "edited" };
      return inbox.map((item) => item.id === id ? updated as ReviewItem : item);
    });
    if (!updated) throw new Error(`Review item not found: ${id}`);
    return updated;
  }

  async hasRejectedProposal(proposedChange: string): Promise<boolean> {
    return (await this.readInbox()).some((item) => item.proposedChange === proposedChange && item.status === "rejected");
  }

  private async updateStatus(id: string, status: ReviewItem["status"]): Promise<ReviewItem> {
    let updated: ReviewItem | undefined;
    await this.coordinator.updateJson<ReviewItem[]>(getReviewInboxPath(this.repoPath), [], (inbox) => {
      const existing = inbox.find((item) => item.id === id);
      if (!existing) throw new Error(`Review item not found: ${id}`);
      updated = { ...existing, status };
      return inbox.map((item) => item.id === id ? updated as ReviewItem : item);
    });
    if (!updated) throw new Error(`Review item not found: ${id}`);
    return updated;
  }
}
