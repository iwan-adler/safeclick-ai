# Model card: SafeClick on-device classifier

Trained 2026-10-25 by `npm run train` (deterministic).

## What it is

A logistic-regression model over readable features: lowercase words, adjacent word pairs, and normalized tokens (a phone number, a money amount, a link, a 4–6 digit number). A prediction is the sum of the weights of the features present, passed through a sigmoid. It runs in the browser; no text leaves the device.

## Training data

- dev split of Mishra & Soni (2022) + UCI SMS Spam Collection (scam vs. genuine), plus SafeClick's fictional examples and India augmentation set: 2994 messages.
- 368 scam and 2626 genuine messages. Marketing spam is excluded.
- Includes 60 hand-written, fictional India-context messages ([augment-india.ts](augment-india.ts)) because the public data contains no Indian bank, UPI or delivery alerts; without them the first model flagged genuine Indian transaction SMS.
- The **test** and **india** evaluation sets were not used in any way.

## Model selection (5-fold cross-validation inside the training data)

| L2 strength | Log loss | AUC |
| --- | --- | --- |
| 0.0001 | 0.0613 | 0.9867 |
| 0.0003 | 0.0569 | 0.9915 |
| 0.001 | 0.0627 | 0.9938 |
| 0.003 | 0.0780 | 0.9933 |
| 0.01 | 0.1093 | 0.9912 |

Chosen: L2 = 0.0003 (lowest log loss). Vocabulary: features appearing in at least 3 messages, at most 6000; 3016 kept after pruning tiny weights.

## Decision thresholds (from out-of-fold predictions)

| Band | Probability ≥ | Genuine flagged (OOF) | Scams flagged (OOF) |
| --- | --- | --- | --- |
| Moderate | 0.500 | 0.5% | 86.4% |
| Strong | 0.875 | 0.2% | 73.1% |

## Most influential features

**Towards scam:** `a link` (3.08), `a phone number` (2.80), `call` (1.18), `claim` (1.14), `a money amount` (1.12), `your` (0.94), `immediately` (0.91), `send` (0.90), `you have` (0.83), `please` (0.82), `account` (0.81), `refund` (0.81), `now` (0.79), `guaranteed` (0.78), `call a phone number` (0.75), `link` (0.75), `a number` (0.75), `pay` (0.74), `message` (0.73), `help` (0.70).

**Towards genuine:** `i` (-1.21), `that` (-0.92), `u` (-0.80), `ok` (-0.74), `ü` (-0.67), `me` (-0.67), `am` (-0.66), `s` (-0.64), `got` (-0.57), `at a number` (-0.55), `up` (-0.52), `a number nov` (-0.52), `nov` (-0.52), `added` (-0.52), `come` (-0.52), `tomorrow` (-0.51), `not` (-0.50), `then` (-0.49), `going` (-0.49), `what` (-0.47).

## Limitations

- The training data is mostly older UK and international SMS; the model knows little about modern Indian scams. The rules carry most of the India coverage.
- It learns surface patterns. A scammer who writes like a friend can score low.
- Its probability describes similarity to the training data, not the chance that a particular message is a scam.
