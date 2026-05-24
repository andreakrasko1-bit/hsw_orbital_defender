import asyncio
from playwright.async_api import async_playwright
from fpdf import FPDF
import os
import time

async def capture_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 720})
        
        file_url = f"file:///{os.path.abspath('index.html').replace(chr(92), '/')}"
        print(f"Loading {file_url}")
        await page.goto(file_url)
        
        # 1. Start Screen
        await asyncio.sleep(2) # Wait for CRT effect and font loading
        await page.screenshot(path="start_screen.png")
        print("Captured start screen")
        
        # Start game
        await page.fill("#nick-input", "PDF_TESTER")
        await page.click("#start-btn")
        
        # 2. Gameplay (Wait a few seconds for asteroids to spawn)
        await asyncio.sleep(3)
        await page.screenshot(path="gameplay_1.png")
        print("Captured gameplay")
        
        # 3. Shop Tab
        await page.click('button[data-tab="shop"]')
        await asyncio.sleep(1)
        await page.screenshot(path="shop_screen.png")
        print("Captured shop")
        
        # Go back to telemetry
        await page.click('button[data-tab="telemetry"]')
        
        # 4. Try to capture some action later
        await asyncio.sleep(4)
        await page.screenshot(path="gameplay_2.png")
        print("Captured gameplay 2")
        
        await browser.close()

def create_pdf():
    pdf = FPDF(orientation='L', unit='mm', format='A4')
    
    screenshots = [
        ("start_screen.png", "Ekran Startowy - NEO DEFENDER"),
        ("gameplay_1.png", "Rozgrywka - Faza Poczatkowa"),
        ("shop_screen.png", "Zbrojownia HSW - Ulepszenia"),
        ("gameplay_2.png", "Rozgrywka - Obrona Orbitalna")
    ]
    
    for img, title in screenshots:
        if os.path.exists(img):
            pdf.add_page()
            pdf.set_font("Arial", size=16)
            pdf.cell(200, 10, txt=title, ln=True, align='C')
            # Add image below title
            pdf.image(img, x=10, y=25, w=277)
    
    pdf_path = "NEO_Defender_Screenshots.pdf"
    pdf.output(pdf_path)
    print(f"PDF created at {pdf_path}")

async def main():
    await capture_screenshots()
    create_pdf()

if __name__ == "__main__":
    asyncio.run(main())
