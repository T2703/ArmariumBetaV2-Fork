const { Builder, By, Browser, until } = require('selenium-webdriver');
const assert = require("assert");

async function slowType(element, text, delay = 100) {
    for (const char of text) {
      await element.sendKeys(char); // Send one character at a time
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for the specified delay
    }
  }

describe('Login Page Tests', function () {
  this.timeout(30000); // Set a timeout for the tests
  let driver;

  before(async () => {
    // Initialize the WebDriver
    driver = await new Builder().forBrowser(Browser.CHROME).build();
  });

  after(async () => {
    // Quit the WebDriver after all tests
    await driver.quit();
  });


  it('Should load the login page', async () => {
    await driver.get('http://localhost:3000/#/login'); // Load the login page
    const currentUrl = await driver.getCurrentUrl();
    assert.strictEqual(currentUrl, 'http://localhost:3000/#/login');
    console.log('Login page loaded successfully');
  });

  it('Should display an error for invalid credentials', async () => {
    await driver.get('http://localhost:3000/#/login');
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const loginButton = await driver.findElement(By.css('.login-button'));

    await emailInput.sendKeys('invalid@example.com');
    await passwordInput.sendKeys('wrongpassword');
    await loginButton.click();


    // Wait for the error message to appear
    const errorMessageElement = await driver.wait(
        until.elementLocated(By.css('.error-message')),
        5000 // Wait up to 5 seconds
      );
  
      // Get the text of the error message
      const errorMessageText = await errorMessageElement.getText();
    // Assuming the error message is displayed in an element with class 'error-message'
    assert.strictEqual(errorMessageText, 'Invalid email or password. Please try again.');
    console.log('Error message displayed for invalid credentials');
  });
  it('should navigate to home page after successful login', async () => {
    await driver.get('http://localhost:3000/#/login');
    
    // Locate the email and password input fields
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const loginButton = await driver.findElement(By.css('.login-button'));
  
    // Clear the input fields before entering new values
    await emailInput.click();
    await emailInput.clear();
  
    // Enter valid credentials
    await slowType(emailInput, 'admin@gmail.com', 200);
        await passwordInput.click();
    await passwordInput.clear();
    await slowType(passwordInput, 'adminadmin', 200);
    await loginButton.click();
  
    // Wait for the URL to change to the home page
    await driver.wait(until.urlIs('http://localhost:3000/#/outfits'), 5000);
    const currentUrl = await driver.getCurrentUrl();
    assert.strictEqual(currentUrl, 'http://localhost:3000/#/outfits');
    console.log('Successfully logged in and navigated to home page');
  });
});