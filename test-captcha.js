const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.ksolves.com/');
  await page.waitForLoadState('networkidle');
  
  // Find the captcha text
  const captchaHTML = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const captchaLabel = labels.find(l => l.textContent && l.textContent.includes('What is'));
    return captchaLabel ? captchaLabel.parentElement.innerHTML : 'Not found';
  });
  console.log('CAPTCHA HTML:', captchaHTML);
  
  // Also get the footer structure and see if it's there
  const footerHTML = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    return footer ? footer.outerHTML.substring(0, 500) : 'No footer';
  });
  console.log('FOOTER HTML:', footerHTML);
  
  await browser.close();
})();
