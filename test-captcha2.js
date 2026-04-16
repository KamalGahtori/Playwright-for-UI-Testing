const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.ksolves.com/');
  await page.waitForLoadState('networkidle');
  
  // Scroll to bottom
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const h = window.innerHeight;
    let s = 0;
    while(s < document.body.scrollHeight) {
      window.scrollBy(0, h);
      s += h;
      await delay(200);
    }
    // Try to trigger lazy renders explicitly just in case
    document.dispatchEvent(new Event('scroll'));
  });
  
  await page.waitForTimeout(2000);
  
  const captchaHTML = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="captcha"], [id*="captcha"]');
    return Array.from(els).map(e => e.outerHTML).join('\\n');
  });
  console.log('CAPTCHA ELS:', captchaHTML.substring(0, 500));
  
  const formHtml = await page.evaluate(() => {
     const h2s = Array.from(document.querySelectorAll('h2, h3, h4, div'));
     const title = h2s.find(h => h.textContent && h.textContent.includes('Have A Project Idea'));
     if(title) {
        return title.parentElement.parentElement.outerHTML.substring(0, 1000);
     }
     return "Form not found";
  });
  console.log('FORM HTML:', formHtml.substring(0, 1000));
  
  await browser.close();
})();
