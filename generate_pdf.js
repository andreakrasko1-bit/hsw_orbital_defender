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

        console.log('Taking start screen...');
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'start.png' });

        console.log('Starting game...');
        await page.type('#nick-input', 'PDF_TESTER');
        await page.click('#start-btn');

        console.log('Waiting for gameplay...');
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: 'gameplay.png' });

        console.log('Opening shop...');
        await page.click('button[data-tab="shop"]');
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'shop.png' });

        await browser.close();

        // Now create a simple HTML and generate PDF
        console.log('Generating PDF...');
        const browserPdf = await puppeteer.launch({ headless: 'new' });
        const pagePdf = await browserPdf.newPage();
        
        const html = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; background: #fff; margin: 0; padding: 20px; }
                h1 { margin-bottom: 20px; }
                img { max-width: 100%; border: 2px solid #ccc; margin-bottom: 40px; }
                .page { page-break-after: always; }
            </style>
        </head>
        <body>
            <div class="page">
                <h1>Ekran Startowy - NEO DEFENDER</h1>
                <img src="file:///${path.resolve('start.png').replace(/\\/g, '/')}" />
            </div>
            <div class="page">
                <h1>Rozgrywka - Obrona Orbitalna</h1>
                <img src="file:///${path.resolve('gameplay.png').replace(/\\/g, '/')}" />
            </div>
            <div class="page">
                <h1>Zbrojownia HSW - Sklep z Ulepszeniami</h1>
                <img src="file:///${path.resolve('shop.png').replace(/\\/g, '/')}" />
            </div>
        </body>
        </html>
        `;

        await pagePdf.setContent(html, { waitUntil: 'networkidle0' });
        await pagePdf.pdf({ path: 'Prezentacja_NEO_Defender.pdf', format: 'A4', landscape: true, printBackground: true });
        
        await browserPdf.close();
        console.log('Done! PDF generated as Prezentacja_NEO_Defender.pdf');

    } catch (err) {
        console.error(err);
    }
})();
