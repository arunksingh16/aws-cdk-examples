# Something to make sure
- Cross-stack references are convenient, but they tightly couple stacks.
- Use them sparingly, especially for foundational infra like VPCs or Redis.
- Prefer resource lookups (fromLookup, fromXyzAttributes) for shared infra.
- Always define env explicitly when you start using lookups.
- If you ever refactor from “cross-stack” to “lookup” — expect all downstream stacks to show updates once, since their resource IDs change in CloudFormation templates.
