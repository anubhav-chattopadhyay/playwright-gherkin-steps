import { Page, expect } from '@playwright/test';
import { step } from '../helpers/StepRegistry';
import { DataTable } from '../helpers/DataTable';

export class SignupPage {
  constructor(private page: Page) {}

  // Signup form (on /login page)
  readonly txtSignupName    = this.page.locator("//*[@data-qa='signup-name']");
  readonly txtSignupEmail   = this.page.locator("//*[@data-qa='signup-email']");
  readonly btnSignup        = this.page.locator("//*[@data-qa='signup-button']");
  readonly errEmailExists   = this.page.locator("//p[contains(text(),'Email Address already exist!')]");

  // Account info form (on /signup page)
  readonly rdoTitleMr       = this.page.locator("//*[@id='id_gender1']");
  readonly rdoTitleMrs      = this.page.locator("//*[@id='id_gender2']");
  readonly txtPassword      = this.page.locator("//*[@data-qa='password']");
  readonly selDays          = this.page.locator("//*[@data-qa='days']");
  readonly selMonths        = this.page.locator("//*[@data-qa='months']");
  readonly selYears         = this.page.locator("//*[@data-qa='years']");
  readonly lblAccountInfo   = this.page.locator("//h2[contains(@class,'title')]/b").first();

  // Address info fields
  readonly txtFirstName     = this.page.locator("//*[@data-qa='first_name']");
  readonly txtLastName      = this.page.locator("//*[@data-qa='last_name']");
  readonly txtCompany       = this.page.locator("//*[@data-qa='company']");
  readonly txtAddress       = this.page.locator("//*[@data-qa='address']");
  readonly txtAddress2      = this.page.locator("//*[@data-qa='address2']");
  readonly selCountry       = this.page.locator("//*[@data-qa='country']");
  readonly txtState         = this.page.locator("//*[@data-qa='state']");
  readonly txtCity          = this.page.locator("//*[@data-qa='city']");
  readonly txtZipcode       = this.page.locator("//*[@data-qa='zipcode']");
  readonly txtMobile        = this.page.locator("//*[@data-qa='mobile_number']");
  readonly btnCreateAccount = this.page.locator("//*[@data-qa='create-account']");

  // Account created page
  readonly lblAccountCreated = this.page.locator("//*[@data-qa='account-created']/b");
  readonly btnContinue       = this.page.locator("//*[@data-qa='continue-button']");

  // Post-login nav
  readonly lnkLoggedInAs     = this.page.locator("//a[contains(text(),'Logged in as')]");

  @step('Given User navigates to AutomationExercise')
  async navigate() {
    await this.page.goto('https://automationexercise.com/login');
  }

  @step('When User submits the signup form')
  async submitSignupForm(table: DataTable) {
    const { name, email } = table.first();
    await this.txtSignupName.fill(name);
    await this.txtSignupEmail.fill(email);
    await this.btnSignup.click();
  }

  @step('Then User should be on the account info page')
  async assertOnAccountInfoPage() {
    await expect(this.page).toHaveURL(/.*signup/);
    await expect(this.lblAccountInfo).toHaveText('Enter Account Information');
  }

  @step('Then Signup error should show email already exists')
  async assertEmailAlreadyExistsError() {
    await expect(this.errEmailExists).toBeVisible();
  }

  @step('When User fills account personal information')
  async fillAccountInfo(table: DataTable) {
    const { title, day, month, year } = table.first();
    const password = process.env['AE_PASSWORD'];
    if (!password) throw new Error('AE_PASSWORD is not set in your .env file');
    await (title === 'Mrs' ? this.rdoTitleMrs : this.rdoTitleMr).check();
    await this.txtPassword.fill(password);
    await this.selDays.selectOption(day);
    await this.selMonths.selectOption(month);
    await this.selYears.selectOption(year);
  }

  @step('When User fills address information')
  async fillAddressInfo(table: DataTable) {
    const row = table.first();
    await this.txtFirstName.fill(row['firstName']);
    await this.txtLastName.fill(row['lastName']);
    await this.txtCompany.fill(row['company'] ?? '');
    await this.txtAddress.fill(row['address']);
    await this.txtAddress2.fill(row['address2'] ?? '');
    await this.selCountry.selectOption(row['country']);
    await this.txtState.fill(row['state']);
    await this.txtCity.fill(row['city']);
    await this.txtZipcode.fill(row['zipcode']);
    await this.txtMobile.fill(row['mobile']);
  }

  @step('When User clicks Create Account')
  async createAccount() {
    await this.btnCreateAccount.click();
  }

  @step('Then Account created page should be shown')
  async assertAccountCreated() {
    await expect(this.page).toHaveURL(/.*account_created/);
    await expect(this.lblAccountCreated).toHaveText('Account Created!');
  }

  @step('When User continues after account creation')
  async continueAfterCreation() {
    await this.btnContinue.click();
  }

  @step('Then User should be logged in as')
  async assertLoggedInAs(table: DataTable) {
    const { name } = table.first();
    await expect(this.lnkLoggedInAs).toContainText(`Logged in as ${name}`);
  }
}
