## Tiny Tools

## Application structure
- Keep the public tool directory at `/` and each utility at `/tools/$toolId`, using a shared catalog and focused workspace modules so new tools share navigation and metadata.
- Process utility text and files in the browser; only account/profile data uses Cloud, to keep user content private.
- Keep one root auth subscription and use the integration-managed authenticated layout for account pages, to prevent competing session guards.
- Express the neo-brutalist presentation through global semantic tokens and Button variants, so visual values remain centrally themed.
