const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.ksolves.com/');
  
  await page.waitForLoadState('networkidle');
  
  await page.evaluate(async () => {
     window.dispatchEvent(new Event('mousemove'));
     window.dispatchEvent(new Event('touchstart'));
     window.dispatchEvent(new Event('scroll'));
     const delay = ms => new Promise(r => setTimeout(r, ms));
     const h = window.innerHeight;
     let s = 0;
     while(s < document.body.scrollHeight) {
       window.scrollBy({ top: h, behavior: 'smooth' });
       s += h;
       await delay(300);
       window.dispatchEvent(new Event('scroll'));
     }
     window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  await page.waitForTimeout(3000);
  
  console.log('Footer initially:', await page.locator('footer#footer-form').isVisible());
  
  // Try turning off WP rocket lazy render class?
  await page.evaluate(() => {
     document.querySelectorAll('[data-wpr-lazyrender]').forEach(el => {
         // Maybe WP Rocket is doing something weird? 
         // Force reveal just in case
     });
  });

  await page.screenshot({ path: 'test-footer-snap.png', fullPage: true });

  await browser.close();
})();
