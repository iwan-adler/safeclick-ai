# SafeClick AI: Accuracy Report (v2, real-world data)

Generated 2026-10-25 from commit `4ab03ce` by `npm run eval`, following the pre-registered [protocol](PROTOCOL.md) and its amendments. Numbers are computed, not hand-edited. A message is **flagged** when rated *Needs caution* or *High concern*.

Columns: the **v1** engine (frozen copy of commit `631ba39`), **v2 rules** alone, and **v2 rules + on-device model** (what the app ships).

## Scams flagged (detection)

| Set | v1 | v2 rules | v2 rules + model |
| --- | --- | --- | --- |
| **Test-unique** (headline: held out, no near-duplicates of dev) | **14.0%**<br><sub>15/107 · CI 8.7%–21.8%</sub> | **58.9%**<br><sub>63/107 · CI 49.4%–67.7%</sub> | **85.0%**<br><sub>91/107 · CI 77.1%–90.6%</sub> |
| Test (all held-out messages) | **22.0%**<br><sub>58/264 · CI 17.4%–27.3%</sub> | **75.4%**<br><sub>199/264 · CI 69.8%–80.2%</sub> | **93.6%**<br><sub>247/264 · CI 89.9%–95.9%</sub> |
| **India** (independent author, Hinglish/Indian) | **66.0%**<br><sub>31/47 · CI 51.7%–77.8%</sub> | **80.9%**<br><sub>38/47 · CI 67.5%–89.6%</sub> | **85.1%**<br><sub>40/47 · CI 72.3%–92.6%</sub> |
| Dev (used for tuning and training) | **16.8%**<br><sub>50/298 · CI 13.0%–21.4%</sub> | **76.5%**<br><sub>228/298 · CI 71.4%–81.0%</sub> | **96.3%**<br><sub>287/298 · CI 93.5%–97.9%</sub> |

## Genuine messages wrongly flagged (false alarms)

| Set | v1 | v2 rules | v2 rules + model |
| --- | --- | --- | --- |
| **Test-unique** (headline: held out, no near-duplicates of dev) | **0.2%**<br><sub>5/2393 · CI 0.1%–0.5%</sub> | **0.3%**<br><sub>7/2393 · CI 0.1%–0.6%</sub> | **0.3%**<br><sub>7/2393 · CI 0.1%–0.6%</sub> |
| Test (all held-out messages) | **0.2%**<br><sub>6/2636 · CI 0.1%–0.5%</sub> | **0.3%**<br><sub>7/2636 · CI 0.1%–0.5%</sub> | **0.3%**<br><sub>7/2636 · CI 0.1%–0.5%</sub> |
| **India** (independent author, Hinglish/Indian) | **2.5%**<br><sub>1/40 · CI 0.4%–12.9%</sub> | **2.5%**<br><sub>1/40 · CI 0.4%–12.9%</sub> | **2.5%**<br><sub>1/40 · CI 0.4%–12.9%</sub> |
| Dev (used for tuning and training) | **0.3%**<br><sub>8/2545 · CI 0.2%–0.6%</sub> | **0.3%**<br><sub>7/2545 · CI 0.1%–0.6%</sub> | **0.3%**<br><sub>7/2545 · CI 0.1%–0.6%</sub> |

Set sizes (scam / genuine): testUnique 107/2393 · test 264/2636 · india 47/40 · dev 298/2545. Speed (rules + model): 0.08 ms per message in Node.js.

## Model quality on test-unique

AUC **0.996** · Brier score **0.0044** (2500 messages).

Calibration: when the model gives a probability in a range, how often the message is actually a scam.

| Model probability | Messages | Mean predicted | Actually scam |
| --- | --- | --- | --- |
| 0.0–0.1 | 2390 | 0.9% | 0.2% |
| 0.1–0.3 | 11 | 16.8% | 36.4% |
| 0.3–0.5 | 7 | 42.2% | 100.0% |
| 0.5–0.7 | 7 | 60.6% | 100.0% |
| 0.7–0.9 | 18 | 82.1% | 100.0% |
| 0.9–1.0 | 67 | 98.1% | 100.0% |

## Data

- **Test and dev:** the [Mishra & Soni (2022) SMS Phishing Dataset](https://data.mendeley.com/datasets/f45bkkt8pr/1) and the [UCI SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), merged, de-duplicated and split 50/50 by a hash of each message. Scam = smishing; genuine = ham. Both CC BY 4.0, downloaded at evaluation time, not redistributed.
- **Test-unique** removes test messages that are near-duplicates of dev messages (same text without digits, or ≥ 70% word overlap). Many scam texts are templates, so this is the fairest estimate of performance on new messages.
- **India:** hand-written Hinglish and Indian-context messages from the [Bolewar (2026) dataset](https://huggingface.co/datasets/bolewara/hinglish-scam-text-dataset) (CC BY 4.0), excluding rows copied from UCI. A different author; never used for tuning or training.
- Dataset artifacts (anonymization placeholders such as `&lt;#&gt;`, mis-decoded characters) are cleaned before analysis; the dev/test assignment is unaffected.
- Individual real-world messages are not reproduced in this report.

## Marketing spam (not the target)

SafeClick flags 62.8% (223/355; 95% CI 57.7%–67.7%) of test-set marketing spam. This is reported for transparency and is not counted as detection or false alarm.

## The original fictional set (v1 held-out)

The 80 messages in [heldout.ts](heldout.ts) are **no longer held out** (their misses motivated v2 changes, and they are in the model's training data). For history only: scams flagged 95.0% (38/40; 95% CI 83.5%–98.6%); genuine wrongly flagged 0.0% (0/40; 95% CI 0.0%–8.8%).

## Honest caveats

- Dev/test data is dominated by older UK SMS and international smishing. It is not a random sample of the scams people receive in India today.
- The India set is small; read its confidence intervals. Six of its messages were seen while inspecting the dataset's format, before the protocol was written; no rule was written for them.
- Rules were improved using dev data and general knowledge of scam tactics. The model was trained on dev plus fictional messages. Test, test-unique and india results were computed once, after all changes.
- Pattern matching and the model see text only. Neither can check a link's real destination or a sender's identity.
