const puppeteer = require('puppeteer');
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

        console.log('Mocking the UI...');
        await page.evaluate(() => {
            // Hide start overlay
            document.getElementById('start-overlay').classList.add('hidden');

            // Show and populate City Impact Modal for Stalowa Wola
            document.getElementById('city-modal').classList.remove('hidden');
            document.getElementById('city-modal-title').innerText = 'UDERZENIE W: STALOWA WOLA!';
            document.getElementById('city-modal-title').style.color = '#FF0000';
            
            document.getElementById('city-modal-desc').innerHTML = 'Asteroida (2026 STW) uderzyła w parking przy HSW. Trzy samochody zniszczone.<br><br>Koszt ratunku: <span style="color:#FFD700">0 coinów</span>';
            
            const btns = document.getElementById('city-modal-buttons');
            btns.innerHTML = ''; // Clear existing buttons
            
            // Add ONLY the save button (as per game logic for Stalowa Wola)
            const btnSave = document.createElement('button');
            btnSave.className = 'fire-button';
            btnSave.innerText = 'RATUJ (0)';
            btns.appendChild(btnSave);
            
            // Also add some background visual context (like the HUD values)
            document.getElementById('lives-value').innerText = ''; // 0 lives
        });

        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: 'stalowa_wola_impact.png' });

        await browser.close();
        console.log('Done!');
    } catch (err) {
        console.error(err);
    }
})();
