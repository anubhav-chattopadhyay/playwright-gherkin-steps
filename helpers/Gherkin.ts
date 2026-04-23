import { runStep } from './StepRegistry';
import { DataTable } from './DataTable';

type TableInput = string | DataTable;

function resolveTable(input?: TableInput): DataTable | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return new DataTable(input);
  return input;
}

type StepFn = (description: string, table?: TableInput) => Promise<void>;

type GherkinContext = {
  Given: StepFn;
  When: StepFn;
  Then: StepFn;
  And: StepFn;
};

/**
 * Returns Gherkin-style step functions (Given/When/Then/And) for use inside Playwright tests.
 *
 * Table styles:
 *   Option 1 — inline string:    await Given('step', `| col |\n| val |`)
 *   Option 2 — DataTable object: await Given('step', new DataTable(`...`))
 */
export function createGherkin(): GherkinContext {
  const makeRunner = (keyword: string): StepFn =>
    async (description: string, table?: TableInput) => {
      const resolved = resolveTable(table);
      await runStep(`${keyword} ${description}`, resolved);
    };

  return {
    Given: makeRunner('Given'),
    When: makeRunner('When'),
    Then: makeRunner('Then'),
    And: makeRunner('And'),
  };
}
