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

  it('Should swipe the top swipeable container to the left', async () => {
    // Navigate to the outfit page
    await driver.sleep(10000); // Wait for the wardrobe page to load
    // Wait for the top swipeable container to load
    const swipeableContainer = await driver.wait(
      until.elementLocated(By.css('top-swipeable')),
      5000
    );

    // Get the initial image source
    const initialImage = await swipeableContainer.findElement(By.id('top-swipeable')).getAttribute('src');

    // Simulate a swipe to the left
    const actions = driver.actions({ async: true });
    await actions
        .move({ origin: swipeableContainer }) // Move to the swipeable container
        .press() // Press down to start the swipe
        .move({ origin: swipeableContainer, x: -500, y: 0 }) // Drag to the left
        .release() // Release to complete the swipe
        .perform();

    // Wait for the swipe animation to complete
    await driver.sleep(1000);

    // Get the new image source
    const newImage = await swipeableContainer.findElement(By.css('img')).getAttribute('src');

    // Verify that the image has changed
    assert.notStrictEqual(initialImage, newImage, 'The image did not change after swiping left');
    console.log('Successfully swiped the top swipeable container to the left');
  });



    console.log('Swiped left on the first outfit card');
  });