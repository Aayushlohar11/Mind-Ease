# Frontend

UI pages, components, and client-side code.

## Structure

```
frontend/
  pages/         # Page implementations (routed via app/ re-exports)
  components/    # React UI components
  styles/        # Global CSS
  lib/           # UI utilities (e.g. cn())
  public/        # Static assets
```

## Pages

Routes live in root `app/` as thin re-exports, e.g.:

```tsx
export { default } from '@frontend/pages/chat/page'
```
