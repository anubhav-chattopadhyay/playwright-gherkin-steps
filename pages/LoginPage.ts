import { Page } from '@playwright/test';

// Login steps will be added when login tests are written
export class LoginPage {
  constructor(readonly page: Page) {}
}
