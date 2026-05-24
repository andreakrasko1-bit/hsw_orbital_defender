const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        const filePath = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
        console.log('Navigating to', filePath);
        await page.goto(filePath, { waitUntil: 'networkidle0' });

        console.log('Starting game...');
        await page.type('#nick-input', 'ACTION_HERO');
        await page.click('#start-btn');

        console.log('Waiting for wave break to finish (4s) + some time for asteroids to spawn (5s)...');
        await new Promise(r => setTimeout(r, 9000));

        console.log('Moving mouse to center to aim up...');
        await page.mouse.move(640, 200);

        console.log('Shooting for a bit...');
        await page.keyboard.down('Space');
        
        // wait for bullets to be visible on screen
        await new Promise(r => setTimeout(r, 400));
        
        await page.screenshot({ path: 'action_shot.png' });
        
        await page.keyboard.up('Space');

        await browser.close();
        console.log('Done!');
    } catch (err) {
        console.error(err);
    }
})();
