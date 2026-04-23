import { test } from '@playwright/test';

type StepFn = (...args: any[]) => Promise<void>;

const stepRegistry = new Map<string, { instance: any; method: StepFn }>();

/**
 * Strips the Gherkin keyword prefix (Given/When/Then/And) so that
 * @step('Given User logs in') and Given('User logs in') resolve to the same key.
 */
function normalizeKey(description: string): string {
  return description.toLowerCase().replace(/^(given|when|then|and)\s+/, '');
}

/**
 * Stage 3 decorator — registers a page object method as a named step.
 * The Gherkin keyword prefix in the description is optional and ignored for matching.
 * Usage: @step('When User clicks submit')
 */
export function step(description: string) {
  return function <T extends StepFn>(
    originalMethod: T,
    _context: ClassMethodDecoratorContext
  ): T {
    stepRegistry.set(normalizeKey(description), {
      instance: null,
      method: originalMethod,
    });
    return originalMethod;
  };
}

/**
 * Binds all @step-decorated methods on a page object instance to the registry
 * so that `this.page` resolves correctly inside each method.
 * Call once per page object after instantiation.
 */
export function registerSteps(instance: any) {
  const prototype = Object.getPrototypeOf(instance);
  for (const key of Object.getOwnPropertyNames(prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    if (descriptor && typeof descriptor.value === 'function') {
      for (const [stepKey, entry] of stepRegistry.entries()) {
        if (entry.method === descriptor.value) {
          stepRegistry.set(stepKey, { instance, method: descriptor.value });
        }
      }
    }
  }
}

/**
 * Looks up and executes a registered step by description.
 */
export async function runStep(description: string, ...args: any[]) {
  const entry = stepRegistry.get(normalizeKey(description));
  if (!entry) {
    throw new Error(`No step found matching: "${description}"`);
  }
  await test.step(description, async () => {
    await entry.method.call(entry.instance, ...args);
  });
}
