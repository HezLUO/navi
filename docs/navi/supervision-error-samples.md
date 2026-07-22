# Navi Supervision Error Samples

Status: observed product-behavior evidence; not implementation approval

## 2026-07-21: Execution Dispatch Was Mistaken For Main-Task Closure

Context:

- The Main Task created the visible Manual Update Fallback Execution Task in an
  isolated worktree.
- The Execution Task was expected to return a direct `review-ready` or
  `decision-required` event.
- The Main Task then told the user that no additional `continue` input was
  required and ended the turn.

Expected behavior:

- Apply the Post-Delivery Continuity Gate after successful task creation.
- Distinguish an active lane from the state of the whole Main Task.
- Check whether useful non-conflicting design or supervision work remains.
- Surface the smallest concrete next option when it improves user control.

Observed behavior:

- The Main Task treated successful Execution dispatch as a reason to close the
  turn.
- It did not mention the already identified, non-conflicting Navi Delegation
  Gate V1 design work.
- The user had to ask whether worthwhile non-conflicting design existed and why
  it had not been mentioned.

Classification:

- Missed Post-Delivery Continuity check.
- Lane-level activity was incorrectly treated as whole-task closure.
- This was a supervision-adherence failure, not a host event-delivery or
  worktree failure.

Correction rule:

- After dispatching or accepting a bounded lane, evaluate the Main Task
  separately.
- If a valuable non-conflicting activity exists, name its purpose, boundary,
  and stop point without requiring a content-free `continue`.
- Do not manufacture low-value work merely to avoid waiting.

Related task identities:

- Source Main Task: `019f1cc8-2630-7d72-94ba-d12f5b12508b`
- Execution Task: `019f84bb-0cb2-7573-b90d-b4a4a88ac59c`
