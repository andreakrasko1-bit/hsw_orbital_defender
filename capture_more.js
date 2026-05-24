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
        await page.type('#nick-input', 'PDF_TESTER');
        await page.click('#start-btn');

        console.log('Waiting for gameplay...');
        await new Promise(r => setTimeout(r, 2000));

        // 1. Capture Telemetry Card
        console.log('Capturing Telemetry...');
        await page.evaluate(() => {
            // Ensure shop is hidden
            document.getElementById('shop-tab').classList.add('hidden');
            document.getElementById('telemetry-tab').classList.remove('hidden');
            document.querySelector('[data-tab="shop"]').classList.remove('active');
            document.querySelector('[data-tab="telemetry"]').classList.add('active');

            // inject an asteroid and force HUD update
            if(window.generateAsteroid) generateAsteroid(true); // force boss
            if(window.updateHUD) updateHUD();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'telemetry_nasa.png' });

        // 2. Capture City Impact Modal
        console.log('Capturing City Impact...');
        await page.evaluate(() => {
            // trigger city impact
            if(window.triggerCityImpact && window.state && window.state.asteroids.length > 0) {
                triggerCityImpact(window.state.asteroids[0]);
            }
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'city_impact.png' });

        // 3. Capture Game Over Screen
        console.log('Capturing Game Over...');
        await page.evaluate(() => {
            if(window.closeModal) closeModal();
            if(window.gameOver) gameOver('Warszawa');
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'game_over.png' });

        await browser.close();
        console.log('Done!');
    } catch (err) {
        console.error(err);
    }
})();
