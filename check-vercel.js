const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log('Navigating to https://donatefate.vercel.app/');
  await page.goto('https://donatefate.vercel.app/', { waitUntil: 'networkidle0' });
  
  console.log('Done!');
  await browser.close();
})();
