every time remeber with starting any thing say بسم الله

🔹 Development Guidelines (Laravel + React, Expanded)
🗄 Database & Migrations

Use one single migration file for entire schema.

Update only that file for schema changes.

Include seed data directly in migration when needed.

Add indexes for frequently queried columns.

Avoid N+1 queries → always use eager loading.

Ensure schema is optimized for expected queries.

Use Redis caching for large/heavy data.

Keep database table structures consistent across system.

🧑‍💻 Code Quality & Structure

Remove duplicate functions, variables, and imports.

No debug/test code (console.log, dd, etc.).

Split large files into smaller ones (<500 lines).

Separate UI, logic, and data layers.

Use a centralized API service layer, not raw fetch calls.

Keep consistent backend authentication patterns.

Maintain consistent frontend style patterns.

Always ensure clean, production-ready code.

📱 Frontend & React

Design must be fully responsive.

Mobile + tablet share one design.

Desktop has a separate responsive layout.

Use %, rem, flex, grid, breakpoints (no fixed px).

Apply lazy loading for large components.

Use useMemo for expensive calculations.

Use useCallback for event handlers.

Add debouncing for search and filtering.

Support list virtualization for very large data if needed.

⚙️ State Management & Types

Avoid scattered useState.

Prefer useReducer or a store (Redux/Zustand).

Normalize data structures for scalability.

Do not use any type in TypeScript.

Use strict types, guards, and unions.

🪟 Modals

Render modals inside <body>.

Ensure they open above all UI (header, sidebar, content).

Center modals on screen.

Only one modal open at a time.

Manage modals with a unified reducer system.

Add Enter key support.

Add focus management for accessibility.

Load modal content lazily.

🌍 Translations & URLs

All new text must be translation-ready.

Laravel → use lang or trans().

React → use i18n.

No hardcoded/static URLs.

Laravel → use config('app.url') or env('APP_URL').

React → use .env (e.g., VITE_APP_API_URL).

🖥 UX & Accessibility

Always add loading states.

Use skeletons for better UX.

Apply optimistic updates when appropriate.

Ensure ARIA labels, keyboard navigation, screen reader support.

Add error boundaries to handle failures gracefully.

Follow WCAG 2.1 AA accessibility standards.



everytime fix npm run types and npm run lint

don't use complex ways use standard recommended ways for things