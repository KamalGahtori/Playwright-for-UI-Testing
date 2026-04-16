const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.ksolves.com/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    await new Promise(r => setTimeout(r, 2000));
  });
  
  const formHtml = await page.evaluate(() => {
     let c = document.querySelector('input[placeholder="Type Your Answer"]');
     if (!c) c = document.querySelector('.ks-captcha-line');
     if(c) {
         return c.parentElement.parentElement.outerHTML;
     }
     return "not found";
  });
  console.log('FORM EL:', formHtml);
  await browser.close();
})();
