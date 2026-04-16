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
  });
  
  await page.waitForTimeout(2000);
  
  const formHtml = await page.evaluate(() => {
     let c = document.querySelector('input[placeholder="Type Your Answer"]');
     if (!c) c = document.querySelector('.ks-captcha-line');
     if (!c) {
         const labels = Array.from(document.querySelectorAll('label'));
         const lbl = labels.find(l => l.textContent && l.textContent.includes('What is'));
         if (lbl) c = lbl;
     }
     if (c) {
         let p = c.parentElement;
         for(let i=0; i<3; i++) { if(p.parentElement) p = p.parentElement; }
         return p.innerHTML.substring(0, 500);
     }
     return "not found";
  });
  console.log('FORM EL:', formHtml);
  
  // Let's also check if Footer is properly loaded:
  const footerLoaded = await page.evaluate(() => {
     return !!document.querySelector('footer iframe, footer p, footer a');
  });
  console.log('FOOTER LOADED:', footerLoaded);

  await browser.close();
})();
