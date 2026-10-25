# Security Policy

## Intended safe use

SafeClick AI is an **educational scam-awareness tool**. It is meant to help people notice common warning signs in messages and to encourage independent verification before they click, reply, pay or share information.

It is **not**:

- a security product, spam filter or fraud-detection service;
- a way to verify who sent a message or whether a link is currently malicious;
- a replacement for your bank, employer, mobile provider or local authorities;
- legal, financial or investment advice.

Please do not rely on a low score as permission to act on a message. When in doubt, contact the organization through details you already have.

## Data handling

- Message text is analyzed in the browser tab's memory and is never transmitted, persisted or logged by the application.
- In production, a Content-Security-Policy with `connect-src 'self'` prevents page scripts from contacting other origins.
- Links found in messages are never fetched or rendered as clickable links.
- User content is rendered as text nodes; the app does not use `dangerouslySetInnerHTML`.
- Screenshots are read in the browser by a self-hosted Tesseract WebAssembly engine; images are never uploaded, and the OCR library's IndexedDB cache is disabled.
- Content shared from other apps is received by the service worker on the device, held in memory for at most one minute, handed to the page once, and never written to storage. If the service worker is inactive, the `/share` server route redirects without reading the request body.
- The service worker caches only the app's own pages and static assets (including the OCR engine after first use).

## Known limitations

- Detection is rule-based and heuristic. It produces false positives (genuine but urgent messages) and false negatives (well-crafted scams that avoid the patterns).
- The score is not a calibrated probability of fraud.
- Rules are designed for English-language text.
- URL checks are string-based only. They do not check domain age, reputation, certificates or page content.
- Images, attachments, QR codes and voice calls are not analyzed.
- Offline support requires one prior online visit in the same browser and a production build served over HTTPS or localhost.
- Screenshot text recognition can misread text; recognized text is always shown for review before analysis.
- Measured accuracy and known missed patterns are documented in `eval/RESULTS.md` and `eval/README.md`.
- The CSP includes `'wasm-unsafe-eval'` so the OCR engine's WebAssembly can compile. This does not permit JavaScript `eval()`.
- The CSP allows `'unsafe-inline'` scripts because statically prerendered Next.js pages include inline bootstrap scripts. There is no user-controlled HTML on any page, which limits the practical impact.

## Reporting a security concern

If you find a vulnerability in SafeClick AI (for example, a way to execute script through pasted content, a privacy leak, or a misleading result that could cause harm), please report it privately to the maintainers rather than opening a public issue. Use the private vulnerability reporting feature of the project's repository host if it is enabled, or contact the team listed in the submission.

Please include:

- a description of the issue and its impact;
- steps to reproduce, using **fictional** data only;
- the browser and version you used.

Please do not include real personal data, real credentials or live malicious links in reports. We aim to acknowledge reports promptly and will credit reporters who wish to be named.

## Responsible use of examples

All example messages and scenarios are fictional and use reserved domains (`.example`) or documentation-only IP addresses (192.0.2.0/24). They are written to teach recognition and must not be adapted to deceive real people.
