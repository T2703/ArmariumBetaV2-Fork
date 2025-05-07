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
    const url = await driver.getCurrentUrl();
    assert.strictEqual(url, 'http://localhost:3000/#/wardrobe', 'Wardrobe page URL is incorrect');
    console.log('Wardrobe page loaded successfully');
  });

});