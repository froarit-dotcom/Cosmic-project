const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        page.on('pageerror', error => {
            console.error('PAGE_ERROR:', error.message);
        });
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('CONSOLE_ERROR:', msg.text());
            }
        });

        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

        // login
        await page.type('input[type="text"]', 'admin');
        await page.type('input[type="password"]', 'admin');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // go to locations
        await page.goto('http://localhost:5173/inventory', { waitUntil: 'networkidle0' });

        // The page crash should be caught by pageerror listener!
        console.log("Wait complete.");
        await browser.close();
    } catch (e) {
        console.error("SCRIPT ERROR:", e.message);
    }
})();
