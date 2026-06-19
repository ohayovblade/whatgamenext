import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Scope coverage to the modules under unit test. DB queries, auth options,
      // and session helpers need Postgres/next-auth and are integration-scope
      // (see test-plan.md "Out of scope").
      include: [
        'src/lib/rawg/**',
        'src/lib/auth/validation.ts',
        'src/lib/auth/password.ts',
        'src/lib/backlog/statuses.ts',
      ],
      reporter: ['text', 'text-summary'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
