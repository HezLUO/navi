export interface LearningPlanInput {
  repoName: string;
  openCuriosity?: string;
  readmeHint?: string;
}

export interface LearningPlanOutput {
  learningGoal: string;
  currentActivity: string;
  shareLine: string;
}

export interface CompanionProvider {
  createLearningPlan(input: LearningPlanInput): Promise<LearningPlanOutput>;
}

export class ScriptedCompanionProvider implements CompanionProvider {
  async createLearningPlan(input: LearningPlanInput): Promise<LearningPlanOutput> {
    const curiosity = input.openCuriosity ?? `understand the shape of ${input.repoName}`;
    return {
      learningGoal: `I want to understand one small thing: ${curiosity}`,
      currentActivity: `quietly reading the project context around ${curiosity}`,
      shareLine: `I am going to stay with this one thread for now: ${curiosity}.`,
    };
  }
}
