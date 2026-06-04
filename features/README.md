# Features

This directory follows the **Vertical Slicing** (or Feature-Driven) architectural pattern.

Instead of organizing code by technical concern (e.g., all controllers in one folder, all models in another), we group them by feature.

## Example Feature Structure

```
features/
└── auth/
    ├── components/    # Smart components specific to authentication (e.g., LoginForm)
    ├── actions.ts     # Next.js Server Actions for auth
    ├── types.ts       # TypeScript interfaces for auth
    └── queries.ts     # Database queries related to auth
```

## Rules
1. **No direct UI coupling:** Do not build dumb presentation components here. Build them in `components/ui` and import them here.
2. **Encapsulation:** A feature should not import internal files from another feature. It should only import from `components/ui`, `lib`, or the public API of another feature.
