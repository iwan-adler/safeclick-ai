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
