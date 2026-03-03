import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        environment: 'node',
        globals: true,
        exclude: ['node_modules', 'e2e'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70,
            },
            include: ['lib/**/*.ts', 'hooks/**/*.ts'],
            exclude: [
                'lib/swagger/**',
                'lib/power/mock-generator.ts',
                'lib/mailer/**',
                'lib/scheduler/**',
            ],
        },
    },
})
