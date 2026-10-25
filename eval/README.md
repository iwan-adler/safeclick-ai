# Accuracy evaluation

SafeClick's accuracy is measured on real, publicly licensed SMS data with a pre-registered protocol. Every number in the app and README comes from these scripts.

| Command | What it does |
| --- | --- |
| `npm run eval` | Final report: [`RESULTS.md`](RESULTS.md), [`results.json`](results.json), and the in-app numbers in `src/lib/data/eval-summary.json` |
| `npm run eval:dev` | Development loop: metrics, misses and false alarms on the **dev** split only |
| `npm run train` | Trains the on-device classifier on dev + fictional data; writes `src/lib/analysis/model/weights.json` and [`MODEL.md`](MODEL.md) |
| `FORCE_BASELINE=1 npm run eval:baseline` | Recomputes the v1 "before" numbers with the frozen engine in [`baseline-engine/`](baseline-engine/) |
| `POSTHOC=1 npm run eval` | Re-measures after post-hoc changes into [`RESULTS-posthoc.md`](RESULTS-posthoc.md), leaving the official report untouched |

The first run downloads three public datasets (under 1 MB) into `eval/.data/` (git-ignored). They are not redistributed.

## Headline results

From the pre-registered final run ([`RESULTS.md`](RESULTS.md)):

| Set | v1 engine | v2 (rules + on-device model) | False alarms (v2) |
| --- | --- | --- | --- |
| **Test-unique** (107 real scams, 2,393 genuine; held out, no near-duplicates of training data) | 14.0% | **85.0%** (95% CI 77.1–90.6%) | 0.3% (0.1–0.6%) |
| **India** (47 scams, 40 genuine; independent author, Hinglish and Indian English) | 66.0% | **85.1%** (72.3–92.6%) | 2.5% (1 of 40) |

The rules alone reach 58.9% on test-unique; the model adds 26 points with no extra false alarms. Model AUC on test-unique: 0.996.

## How the evaluation was kept honest

1. **Pre-registration.** [`PROTOCOL.md`](PROTOCOL.md) was committed before any v2 numbers existed; the git history shows the order of every step.
2. **Dev/test split by hash.** Rules were tuned and the model trained only on the dev half. Test messages were never inspected individually.
3. **Near-duplicate removal.** Scam texts are often templates. The headline "test-unique" set drops test messages that closely match any dev message.
4. **An independent India set.** Written by a different author, never used for tuning or training.
5. **A fair "before".** The v1 engine is frozen in `baseline-engine/` and re-run on exactly the same cleaned data.
6. **One final run.** Changes made afterwards are listed under *Post-hoc changes* in the protocol and re-measured separately.

## What it does not show

- The real-world data is mostly older UK and international SMS, not a random sample of what people in India receive today.
- The India set is small; its confidence intervals are wide.
- Text analysis cannot verify senders or check where links really lead.

## Known gaps (from the earlier v1 evaluation)

The v1 fictional set's misses (`heldout.ts`) drove several v2 fixes, which is why that set no longer counts as held out: "6 digit code" requests, "account on hold", single strong lures, and delivery links without a fee.

## Datasets and licences

- Mishra, S. & Soni, D. (2022). *SMS Phishing Dataset for Machine Learning and Pattern Recognition*. Mendeley Data, doi:10.17632/f45bkkt8pr.1. CC BY 4.0.
- Almeida, T. A. & Hidalgo, J. M. G. (2011). *SMS Spam Collection*. UCI Machine Learning Repository. CC BY 4.0.
- Bolewar, A. (2026). *Hinglish & English Financial Scam/Fraud Text Dataset*. Hugging Face `bolewara/hinglish-scam-text-dataset`. CC BY 4.0.
