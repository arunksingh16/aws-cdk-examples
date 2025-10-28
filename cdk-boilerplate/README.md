# Something to make sure
- Cross-stack references are convenient, but they tightly couple stacks.
- Use them sparingly, especially for foundational infra like VPCs or Redis.
- Prefer resource lookups (fromLookup, fromXyzAttributes) for shared infra.
- Always define env explicitly when you start using lookups.
- If you ever refactor from “cross-stack” to “lookup” — expect all downstream stacks to show updates once, since their resource IDs change in CloudFormation templates.

# note
| Concept               | What it means                           | Problem it caused                    | Fix                                      |
| --------------------- | --------------------------------------- | ------------------------------------ | ---------------------------------------- |
| Cross-stack reference | One stack imports another’s value       | CloudFormation export delete blocked | Use `fromLookup`                         |
| fromLookup()          | Embeds actual AWS resource IDs          | Massive stack updates on refactor    | Accept one-time redeploy                 |
| env                   | Defines where to look for AWS resources | Required for lookup                  | Add `{ account, region }` to every stack |
| Clean structure       | Foundational → Functional stacks        | No circular deps, safe deletion      | Tag + lookup pattern                     |
