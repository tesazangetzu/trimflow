import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  collectCoverageFrom: [
    "src/components/dashboard/chart-tools.ts",
    "src/lib/appointments-status.ts",
    "src/lib/utils.ts",
    "src/components/services/service-form-dialog.tsx",
    "src/components/appointments/appointment-form-dialog.tsx",
    "src/app/(dashboard)/admin/services/page.tsx",
    "src/app/(dashboard)/admin/appointments/page.tsx",
  ],
  coverageThreshold: {
    global: { lines: 80, branches: 75, functions: 73, statements: 80 },
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
}

export default createJestConfig(config)