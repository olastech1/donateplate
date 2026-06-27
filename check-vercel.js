const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log('Navigating to https://donateplate.vercel.app/');
  await page.goto('https://donateplate.vercel.app/', { waitUntil: 'networkidle0' });
  
  console.log('Done!');
  await browser.close();
})();
