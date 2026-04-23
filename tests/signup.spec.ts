import { test } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage';
import { registerSteps } from '../helpers/StepRegistry';
import { createGherkin } from '../helpers/Gherkin';

test.describe('AutomationExercise - User Registration', () => {
  test('new user can register successfully', async ({ page }) => {
    const signupPage = new SignupPage(page);
    registerSteps(signupPage);
    const { Given, When, Then } = createGherkin();

    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    await Given('User navigates to AutomationExercise');

    await When('User submits the signup form', `
      | name     | email          |
      | John Doe | ${uniqueEmail} |
    `);

    await Then('User should be on the account info page');

    await When('User fills account personal information', `
      | title | day | month | year |
      | Mr    | 15  | 6     | 1990 |
    `);

    await When('User fills address information', `
      | firstName | lastName | company   | address       | address2 | country       | state      | city          | zipcode | mobile     |
      | John      | Doe      | Test Corp | 123 Main St   |          | United States | California | San Francisco | 94105   | 9876543210 |
    `);

    await When('User clicks Create Account');
    await Then('Account created page should be shown');

    await When('User continues after account creation');

    await Then('User should be logged in as', `
      | name     |
      | John Doe |
    `);
  });

  test('signup with existing email shows error', async ({ page }) => {
    const signupPage = new SignupPage(page);
    registerSteps(signupPage);
    const { Given, When, Then } = createGherkin();

    await Given('User navigates to AutomationExercise');

    // Use a well-known pre-existing test account email
    await When('User submits the signup form', `
      | name      | email                    |
      | Test User | test@automationexercise.com |
    `);

    await Then('Signup error should show email already exists');
  });
});
