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

## 2026-07-22: Accepted Integration Was Reported Without The Next Decision

Context:

- Delegation Suggestion Gate V1 passed independent Level 3 Validation.
- The user approved a local fast-forward integration into `main`.
- The integration completed cleanly while push, release, and calibration remained
  separate decisions.

Expected behavior:

- Report the exact integrated snapshot and preserved boundaries.
- Apply Next Decision Visibility before returning control.
- Name the smallest real next decision: whether to push the verified local
  `main`, while explicitly excluding tag, release, and publication.
- Explain that automatic Evidence delegation remains blocked and that any
  later calibration must arise from a genuine task rather than an artificial
  probe.

Observed behavior:

- The Main Task reported the successful integration and remaining exclusions.
- It ended without naming the push decision or the next product-level path.
- The user had to ask for the missing next decision.

Classification:

- Repeated Next Decision Visibility failure after a valid completed action.
- The integration stop was valid, but the closeout shape was incomplete.
- This was a supervision-adherence failure, not an integration, validation, or
  event-delivery failure.

Correction rule:

- After validation, integration, push, or another lane-closing action, decide
  whether the whole product line is closed or only the current lane is closed.
- If the session remains active, state one recommended next decision with its
  exact effect and exclusions; do not leave `continue` as the only visible
  route.
- Treat repetition as calibration evidence for the existing rule, not as proof
  that another supervision concept or Runtime Surface is required.

Related task identities:

- Source Main Task: `019f1cc8-2630-7d72-94ba-d12f5b12508b`
- Execution Task: `019f886e-4ff3-7330-b9d9-f5ace5c3aa18`
- Validation Task: `019f888d-8e92-70d2-b10a-1f9b64244a09`
- Integrated snapshot: `16d23cc478c34a5386b7d32beabd146460668b3b`
