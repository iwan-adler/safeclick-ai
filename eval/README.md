# Accuracy evaluation

```bash
npm run eval
```

This runs the current analysis engine over two labelled datasets and regenerates:

- [`RESULTS.md`](RESULTS.md): the full report (numbers, per-category breakdown, misses, false alarms)
- [`results.json`](results.json): machine-readable numbers
- [`../src/lib/data/eval-summary.json`](../src/lib/data/eval-summary.json): the headline numbers shown on the in-app Privacy page

The first run downloads the UCI SMS Spam Collection (about 200 KB) into `eval/.data/`, which is git-ignored. It is not redistributed with SafeClick.

## Datasets

| Dataset | What it is | What it is good for |
| --- | --- | --- |
| [`heldout.ts`](heldout.ts) | 80 fictional messages (40 scam, 40 genuine), including conversation threads and deliberately tricky genuine messages (real OTP texts, "sale ends tonight", rent reminders, sign-in alerts) | Rough detection and false-alarm rates on the kinds of scams SafeClick targets |
| UCI SMS Spam Collection | 5,574 real SMS from around 2011, labelled spam/ham (CC BY 4.0) | False-alarm rate on ordinary personal texts written by real people |

## Protocol

1. The held-out set was written after the rules, separately from the in-app examples and unit tests.
2. It was frozen before the first evaluation run.
3. **The rules were not changed after seeing its results.** Changing rules to fix specific held-out misses would make those numbers meaningless.

## Honest caveats

- The same author wrote the rules and the held-out set, so held-out results are likely optimistic.
- The SMS dataset labels *spam*, not *scams*. Most of its spam is premium-rate marketing that SafeClick does not try to flag, so low detection there is expected. Its main use is measuring false alarms on genuine texts.
- Neither dataset is a random sample of the scams people receive today.

## What the first run taught us (roadmap)

The missed held-out scams point to concrete gaps, listed here rather than patched, to keep the evaluation honest:

- **Code requests phrased as "the 6 digit code we sent"**: the code-request rule does not recognize "N digit code".
- **"Your account is on hold" / "verify your identity"**: these are not in the threat or credential vocabulary.
- **A single strong lure**: an investment pitch or job offer on its own scores just under the "needs caution" threshold (20).
- **Delivery messages with only a link and no fee**: nothing in the text is unusual enough to flag.
- **Polite, pressure-free payment requests** (the documented demo limitation).

To improve these without fooling ourselves: fix the rules, then measure against a **new** held-out set written by someone else (for example, classmates writing realistic scam and genuine messages), and keep the original numbers in the history for comparison.
