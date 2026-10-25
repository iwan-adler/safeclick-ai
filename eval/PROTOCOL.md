# Evaluation protocol (v2, real-world data)

This protocol was written and committed **before** any v2 results were computed, so the history shows the rules of the evaluation were fixed in advance.

## Data

| Set | Contents | Used for |
| --- | --- | --- |
| **Pool** | Mishra & Soni (2022) SMS Phishing Dataset (Mendeley, CC BY 4.0) + UCI SMS Spam Collection (CC BY 4.0), de-duplicated on normalized text | Split into dev and test |
| **dev** | Half of the pool, chosen by SHA-256 of the normalized text (first byte even) | Inspecting misses and false alarms, tuning rules, training the classifier |
| **test** | The other half | Reporting only. Individual test messages are never inspected while developing |
| **india** | Rows of the Bolewar (2026) Hinglish dataset that are *not* copied from UCI: hand-written Hinglish and Indian-context messages by a different author | Reporting only. Never used for tuning or training |
| **v1 held-out** | The 80 fictional messages in `heldout.ts` | No longer held out: its misses directly motivated rule changes. Reported for history only |

Labels: `scam` = smishing (phishing by SMS), `ham` = genuine message, `spam` = unsolicited marketing. The headline metrics compare **scam vs. ham**. Spam is reported separately because SafeClick is not designed to flag ordinary marketing.

## Metrics

- **Detection rate:** share of scam messages rated *Needs caution* or *High concern*.
- **False-alarm rate:** share of ham messages rated *Needs caution* or *High concern*.
- **Precision**, **high-concern rates** and, for the classifier, **calibration** (reliability of its probability).
- Confidence intervals: 95% Wilson intervals on every rate.

## Procedure

1. Record the **baseline**: the v1 engine's aggregate numbers on dev, test and india, before any change. Aggregates only, no per-message inspection of test or india.
2. Improve rules (including India-specific patterns) using **dev** and general knowledge of scam tactics only.
3. Train the on-device classifier on **dev** only, with hyperparameters chosen by cross-validation inside dev.
4. Run the final engine on test and india **once**, and publish the results next to the baseline, whatever they show.
5. If a later change is made after looking at test results, the report must say so, and those test numbers stop counting as held-out.

## Amendment 1 (committed before any v2 test results were computed)

Many real scam texts are templates that differ only in numbers or a few words (for example the same prize text with different phone numbers). The hash split can put one copy in dev and another in test, which would flatter anything tuned on dev. To report honestly:

- The **headline test number** uses **test-unique** messages only: test messages are excluded if, after removing digits, their normalized text matches a dev message, or if their word sets overlap a dev message with Jaccard similarity ≥ 0.7.
- The full test set is still reported alongside, for completeness.
- The split itself is unchanged, so no message already inspected in dev moves into test.

## Amendment 2: classifier

- The classifier is trained on dev (scam vs. ham; marketing spam excluded) plus the fictional examples and the v1 fictional set, which are not part of any test set.
- Its regularization strength is chosen by 5-fold cross-validation on that training data, and its decision thresholds are chosen from out-of-fold predictions so that at most 1% (moderate) and 0.2% (strong) of genuine training messages would be flagged.

## Amendment 3: India augmentation (committed before any v2 test results were computed)

The first classifier flagged genuine Indian transaction alerts (found with hand-written unit-test messages, not evaluation data). A fictional, hand-written India augmentation set (`augment-india.ts`) is added to classifier training only. It is never used for evaluation, and the independent **india** set remains untouched.

## Post-hoc changes (made after the pre-registered final run at commit 4ab03ce)

These changes were made after test/india results were first computed. The pre-registered numbers remain the official result; re-measured numbers are reported separately and are **not** strictly held out.

1. India rule: Hinglish "kat jayega" (masculine) added alongside "kat jayegi" for electricity disconnection threats. Found while writing an in-app example, not from evaluation data.
