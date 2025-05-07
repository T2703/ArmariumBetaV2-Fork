const { Builder, By, until, } = require('selenium-webdriver');
const assert = require('assert');

async function slowType(element, text, delay = 100) {
    for (const char of text) {
      await element.sendKeys(char); // Send one character at a time
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for the specified delay
    }
  }

describe('Wardrobe Page Tests', function () {
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

  it('Should load the wardrobe page', async () => {
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
    await driver.wait(until.elementLocated(By.css('.navbar')), 10000); // Wait up to 10 seconds
    console.log('Wardrobe page loaded successfully');

    const wardrobeLink = await driver.findElement(By.id('wardrobe-link'));


    const actions = driver.actions({async: true});
    await actions.move({origin: wardrobeLink}).perform();

    // Wait for the dropdown menu to appear
    await driver.wait(until.elementLocated(By.css('.dropdown-menu')), 5000);

    // Locate and click the "My Clothes" link in the dropdown
    const myClothesLink = await driver.findElement(By.linkText('My Clothes'));
    await myClothesLink.click();

    // Wait for the wardrobe page to load
    await driver.wait(until.urlIs('http://localhost:3000/#/wardrobe'), 10000); // Wait up to 10 seconds

    // Verify that the URL is correct
    const currentUrl = await driver.getCurrentUrl();
    assert.strictEqual(currentUrl, 'http://localhost:3000/#/wardrobe');
    console.log('Wardrobe page loaded successfully');

  });

});