# playwright-gherkin-steps

BDD-style Given/When/Then steps for Playwright — no feature files, no Cucumber, no extra runtime. Write readable, structured tests using plain TypeScript decorators and DataTables, powered entirely by native Playwright.

---

## Why this exists

Most BDD solutions for Playwright (CucumberJS, playwright-bdd) require you to maintain separate `.feature` files, wire up a step definition runner, and manage a parallel toolchain alongside Playwright. This project takes a different approach:

- Your tests are plain Playwright `test()` blocks — the native runner is untouched
- `Given`, `When`, `Then` are just functions that call your page object methods by name
- DataTables are parsed from inline template literals — no `.feature` file needed
- Zero runtime dependencies beyond Playwright itself

The result is BDD-style readability with none of the framework overhead.

---

## Installation

```bash
npm install @playwright/test
npm install --save-dev typescript ts-node
```

Copy the three helper files into your project:

```
helpers/
  DataTable.ts
  StepRegistry.ts
  Gherkin.ts
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "ESNext"],
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"],
    "outDir": "dist"
  },
  "include": [
    "helpers/**/*.ts",
    "pages/**/*.ts",
    "tests/**/*.ts",
    "playwright.config.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
```

The `target` setting only affects how page objects are written — the helper files (`DataTable`, `StepRegistry`, `Gherkin`) work correctly at any target.

---

## Project structure

```
project/
├── helpers/
│   ├── DataTable.ts       — parses pipe-delimited tables into row objects
│   ├── StepRegistry.ts    — @step decorator, registerSteps(), runStep()
│   └── Gherkin.ts         — createGherkin() returning Given/When/Then/And
├── pages/
│   └── SignupPage.ts      — page object with @step-decorated methods
├── tests/
│   ├── signup.spec.ts             — BDD style using Given/When/Then
│   └── datatableExampleSignUp.spec.ts — direct style using DataTable objects
├── .env                   — credentials (never commit this)
├── .env.example           — template for required env vars
├── global-setup.ts        — loads .env before any test runs
└── playwright.config.ts
```

## Style 1 — BDD (Given/When/Then)

This style reads like a Gherkin scenario but lives entirely inside a native Playwright `test()` block.

### Step 1 — Decorate your page object methods

Locators can be declared as class properties and referenced in methods. There are two ways to write this depending on your `tsconfig` target.

**Option A — Locators as field initializers (requires `target: ES2020`)**

The constructor comes first, then locators are declared as fields below it. With `target: ES2020`, TypeScript compiles field initializers into the constructor body after `this.page = page`, so `this.page` is defined when the locators run.

```typescript
// pages/SignupPage.ts
import { Page, expect } from "@playwright/test";
import { step } from "../helpers/StepRegistry";
import { DataTable } from "../helpers/DataTable";

export class SignupPage {
  constructor(private page: Page) {}

  readonly txtSignupName = this.page.locator("//*[@data-qa='signup-name']");
  readonly txtSignupEmail = this.page.locator("//*[@data-qa='signup-email']");
  readonly btnSignup = this.page.locator("//*[@data-qa='signup-button']");

  @step("Given User navigates to AutomationExercise")
  async navigate() {
    await this.page.goto("https://automationexercise.com/login");
  }

  @step("When User submits the signup form")
  async submitSignupForm(table: DataTable) {
    const { name, email } = table.first();
    await this.txtSignupName.fill(name);
    await this.txtSignupEmail.fill(email);
    await this.btnSignup.click();
  }

  @step("Then User should be on the account info page")
  async assertOnAccountInfoPage() {
    await expect(this.page).toHaveURL(/.*signup/);
  }
}
```

> **Why `target: ES2020` matters here:** With `target: ES2022+`, TypeScript uses native class fields which initialize _before_ the constructor body. That means `this.page` is still `undefined` when `this.page.locator(...)` fires — causing a runtime crash. The helper files (`DataTable`, `StepRegistry`, `Gherkin`) are unaffected by this — they contain no field initializers that reference constructor parameters.

**Option B — Locators assigned inside the constructor (works at any target)**

If you need `target: ES2022+` or want to be explicit regardless of compiler settings, assign locators inside the constructor body instead:

```typescript
import { Page, Locator, expect } from "@playwright/test";
import { step } from "../helpers/StepRegistry";
import { DataTable } from "../helpers/DataTable";

export class SignupPage {
  readonly txtSignupName: Locator;
  readonly txtSignupEmail: Locator;
  readonly btnSignup: Locator;

  constructor(private page: Page) {
    this.txtSignupName = page.locator("//*[@data-qa='signup-name']");
    this.txtSignupEmail = page.locator("//*[@data-qa='signup-email']");
    this.btnSignup = page.locator("//*[@data-qa='signup-button']");
  }

  @step("Given User navigates to AutomationExercise")
  async navigate() {
    await this.page.goto("https://automationexercise.com/login");
  }

  @step("When User submits the signup form")
  async submitSignupForm(table: DataTable) {
    const { name, email } = table.first();
    await this.txtSignupName.fill(name);
    await this.txtSignupEmail.fill(email);
    await this.btnSignup.click();
  }

  @step("Then User should be on the account info page")
  async assertOnAccountInfoPage() {
    await expect(this.page).toHaveURL(/.*signup/);
  }
}
```

### Step 2 — Write the test

```typescript
// tests/signup.spec.ts
import { test } from "@playwright/test";
import { SignupPage } from "../pages/SignupPage";
import { registerSteps } from "../helpers/StepRegistry";
import { createGherkin } from "../helpers/Gherkin";

test("new user can register successfully", async ({ page }) => {
  const signupPage = new SignupPage(page);
  registerSteps(signupPage); // binds page instance to @step methods
  const { Given, When, Then } = createGherkin();

  const uniqueEmail = `testuser_${Date.now()}@example.com`;

  await Given("User navigates to AutomationExercise");

  await When(
    "User submits the signup form",
    `
    | name     | email          |
    | John Doe | ${uniqueEmail} |
  `,
  );

  await Then("User should be on the account info page");

  await When(
    "User fills account personal information",
    `
    | title | day | month | year |
    | Mr    | 15  | 6     | 1990 |
  `,
  );

  await When(
    "User fills address information",
    `
    | firstName | lastName | company   | address     | address2 | country       | state      | city          | zipcode | mobile     |
    | John      | Doe      | Test Corp | 123 Main St |          | United States | California | San Francisco | 94105   | 9876543210 |
  `,
  );

  await When("User clicks Create Account");
  await Then("Account created page should be shown");
  await When("User continues after account creation");

  await Then(
    "User should be logged in as",
    `
    | name     |
    | John Doe |
  `,
  );
});
```

### How the keyword prefix works

The `Given`, `When`, `Then`, and `And` functions are all identical — the keyword is purely for human readability. When looking up a step, the keyword prefix is stripped automatically, so these are equivalent:

```typescript
@step('When User submits the signup form')   // registered as: 'user submits the signup form'
await When('User submits the signup form')   // looked up as:  'user submits the signup form'
await Given('User submits the signup form')  // also works — keyword is ignored
```

---

## Style 2 — DataTable only (no BDD layer)

If you prefer calling page object methods directly without the `Given/When/Then` wrapper, you can use `DataTable` standalone in any native Playwright test. No `@step` decorators or `registerSteps` needed.

```typescript
// tests/datatableExampleSignUp.spec.ts
import { test } from "@playwright/test";
import { SignupPage } from "../pages/SignupPage";
import { DataTable } from "../helpers/DataTable";

test("new user can register successfully", async ({ page }) => {
  const signupPage = new SignupPage(page);

  const signupData = new DataTable(`
    | name     | email                              |
    | John Doe | testuser_${Date.now()}@mailinator.com |
  `);

  const accountInfo = new DataTable(`
    | title | day | month | year |
    | Mr    | 15  | 6     | 1990 |
  `);

  const addressInfo = new DataTable(`
    | firstName | lastName | company   | address     | address2 | country       | state      | city          | zipcode | mobile     |
    | John      | Doe      | Test Corp | 123 Main St |          | United States | California | San Francisco | 94105   | 9876543210 |
  `);

  await signupPage.navigate();
  await signupPage.submitSignupForm(signupData);
  await signupPage.assertOnAccountInfoPage();
  await signupPage.fillAccountInfo(accountInfo);
  await signupPage.fillAddressInfo(addressInfo);
  await signupPage.createAccount();
  await signupPage.assertAccountCreated();
  await signupPage.continueAfterCreation();
  await signupPage.assertLoggedInAs(
    new DataTable(`
    | name     |
    | John Doe |
  `),
  );
});
```

This style suits teams that want structured test data (Cucumber-style DataTables) without adopting the full BDD vocabulary.

---

## DataTable API

`DataTable` parses any pipe-delimited string into an array of row objects keyed by the header row.

```typescript
const table = new DataTable(`
  | name     | email                |
  | John Doe | john@mailinator.com  |
  | Jane Doe | jane@mailinator.com  |
`);
```

| Method                 | Returns                                   | Use when                          |
| ---------------------- | ----------------------------------------- | --------------------------------- |
| `table.first()`        | `{ name: 'John Doe', email: 'john@...' }` | Table has one data row            |
| `table.hashes()`       | Array of all row objects                  | Looping over multiple rows        |
| `table.column('name')` | `['John Doe', 'Jane Doe']`                | You need a flat list of one field |

### Looping over multiple rows

```typescript
for (const user of table.hashes()) {
  console.log(user.name, user.email);
}
```

### Accessing a specific row by index

```typescript
table.hashes()[0]; // first row
table.hashes()[1]; // second row
```

### Empty cells are preserved

A blank cell does not shift subsequent columns — the value is stored as an empty string:

```typescript
const table = new DataTable(`
  | firstName | address2 | country |
  | John      |          | India   |
`);

table.first().address2; // ''
table.first().country; // 'India'  ← not shifted
```

---

## Playwright HTML report integration

Every `Given`, `When`, `Then`, and `And` call is automatically wrapped in Playwright's native `test.step()`, so the HTML report breaks the test down step by step with timings and pass/fail status per step.

Running the test above produces a report entry like this:

```
✓ new user can register successfully

    ✓ Given User navigates to AutomationExercise          45ms
    ✓ When User submits the signup form                   312ms
    ✓ Then User should be on the account info page         28ms
    ✓ When User fills account personal information        189ms
    ✓ When User fills address information                 276ms
    ✓ When User clicks Create Account                     534ms
    ✓ Then Account created page should be shown            61ms
    ✓ When User continues after account creation          198ms
    ✓ Then User should be logged in as                     44ms
```

No additional configuration is needed — the integration is built into `runStep` inside `StepRegistry.ts`. Each keyword (`Given`, `When`, `Then`, `And`) is preserved in the step label exactly as written in the test.

> **Note:** Step-level reporting applies to the BDD style only (`Given/When/Then`). Tests written in the direct DataTable style call page object methods without going through `runStep`, so they appear as a single test entry in the report without sub-steps.

---

## Running the tests

```bash
# Run all tests
npx playwright test

# Run a specific file
npx playwright test tests/signup.spec.ts

# Run headed (see the browser)
npx playwright test --headed

# Open the HTML report after a run
npx playwright show-report
```

---

## How it all fits together

```
@step decorator        →  registers method + description in the StepRegistry at class definition time
registerSteps()        →  binds the live page instance so `this.page` works inside each method
createGherkin()        →  returns Given/When/Then/And — each prefixes its keyword onto the description
Given/When/Then call   →  passes "Given User does X" to runStep
runStep                →  wraps execution in test.step("Given User does X") for the HTML report
                          then strips keyword prefix → looks up registry → calls method.call(instance, dataTable)
DataTable              →  parses pipe-delimited string into row objects on construction
```
