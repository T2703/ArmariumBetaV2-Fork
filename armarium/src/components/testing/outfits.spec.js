const { Builder, By, until, } = require('selenium-webdriver');
const assert = require('assert');

async function slowType(element, text, delay = 100) {
    for (const char of text) {
      await element.sendKeys(char); // Send one character at a time
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for the specified delay
    }
  }

describe('create a outfit', function () {
  this.timeout(30000); // Set a timeout for the tests
  let driver;

  before(async () => {
    // Initialize the WebDriver
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async () => {
    // Quit the WebDriver after all tests
    await driver.quit();
  });
  it('Should load the outfit page', async () => {
    await driver.get('http://localhost:3000/#/login'); // Load the login page
    
    // Locate the email and password input fields
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const loginButton = await driver.findElement(By.css('.login-button'));

    await slowType(emailInput, 'admin@gmail.com', 200);
    await passwordInput.click();
    await slowType(passwordInput, 'adminadmin', 200);
    await loginButton.click();
    // Wait for the wardrobe page to load by waiting for a specific element

    await driver.wait(until.urlIs('http://localhost:3000/#/outfits'), 10000);
    assert.strictEqual(await driver.getCurrentUrl(), 'http://localhost:3000/#/outfits');
    console.log('Wardrobe page loaded successfully');
  })
});