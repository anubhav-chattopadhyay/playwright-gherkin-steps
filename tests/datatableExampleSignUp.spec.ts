import { test } from '@playwright/test';
import { SignupPage } from '../pages/SignupPage';
import { DataTable } from '../helpers/DataTable';

test.describe('AutomationExercise - User Registration (Example)', () => {
  test('new user can register successfully', async ({ page }) => {
    const signupPage = new SignupPage(page);

    const signupData = new DataTable(`
      | name     | email                                |
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
    await signupPage.assertLoggedInAs(new DataTable(`
      | name     |
      | John Doe |
    `));
  });

  test('signup with existing email shows error', async ({ page }) => {
    const signupPage = new SignupPage(page);

    const signupData = new DataTable(`
      | name      | email                       |
      | Test User | test@automationexercise.com |
    `);

    await signupPage.navigate();
    await signupPage.submitSignupForm(signupData);
    await signupPage.assertEmailAlreadyExistsError();
  });
});
