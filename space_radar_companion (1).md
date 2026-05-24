# 🛰️ NEO DEFENDER: COP ORBITAL RADAR – SYSTEM ARCHITECTURE & AI PROMPTS

Ten plik zawiera **kompletny projekt nowej gry** opartej na Twoim pomyśle: **Taktycznym systemie obrony przed planetoidami (NEO - Near Earth Objects)**. Gra wykorzystuje **PRAWDZIWE DANE NA ŻYWO Z NASA API** dotyczące obiektów przelatujących dzisiaj obok Ziemi, łącząc realizm naukowy z humorem oraz elementami Stalowej Woli (COP - Centralny Okręg Przemysłowy).

---

## 🎮 1. MECHANIKA GRY (CORE GAMEPLAY)

1.  **Ekran Główny (Tactical Radar System):**
    *   Wizualny, obracający się radar 360° (radar sweep).
    *   Środek radaru to **Ziemia / Sztab Obrony w Stalowej Woli**.
    *   Na radarze pojawiają się obiekty (asteroidy/komety) zmierzające w stronę centrum.
2.  **Integracja z NASA API (Real Space Data):**
    *   Aplikacja odpytuje publiczne API NASA: `https://api.nasa.gov/neo/rest/v1/feed?start_date=[TODAY]&end_date=[TODAY]&api_key=DEMO_KEY`.
    *   Gra parsuje rzeczywiste obiekty przelatujące dzisiaj obok Ziemi! Każda asteroida ma:
        *   **Realną nazwę** (np. `(2026 AM3)` lub `467317 (2000 QW9)`).
        *   **Realną średnicę** (np. 120 metrów).
        *   **Realną prędkość** (np. 45 000 km/h).
        *   **Realny dystans minimalny** (np. 4.2 mln km / 12 LD - odległości Księżyca).
        *   **Status zagrożenia:** `is_potentially_hazardous_asteroid` (prawdziwa flaga NASA!).
3.  **Interakcja:**
    *   Gracz klika na zbliżającą się kropkę (blip) na radarze.
    *   W panelu bocznym wyświetla się **Karta Telemetryczna NASA** z rzeczywistymi parametrami i wyliczonym współczynnikiem zagrożenia (Threat Score).
    *   Gracz klika **„FIRE INTERCEPTOR”** – z centrum (Stalowej Woli) leci laser/pocisk, który niszczy asteroidę na radarze w efektownej eksplozji.
4.  **Ekonomiczna i Ulepszenia (Progression):**
    *   Za zestrzelenie asteroidy gracz otrzymuje **Gwiezdne Kredyty (✵)** proporcjonalnie do rozmiaru i zagrożenia asteroidy.
    *   W sklepie kupuje ulepszenia:
        *   *Skaner Dalekiego Zasięgu (Radar Range):* Widzi asteroidy wcześniej.
        *   *Działo Kinetyczne „Borsuk” (Plasma Railgun):* Szybszy czas lotu pocisku.
        *   *Głowica Pierogowa (Blast Radius):* Obszarowe zniszczenia (hitbox splasha).
        *   *Tarcza Grawitacyjna „San” (Gravity Shield):* Automatycznie odpycha najbliższą asteroidę raz na 60 sekund.

---

## 🎨 2. RETRO-TRIALNY STYL & LOKALNY HUMOR

*   **Estetyka:** Monochromatyczny, taktyczny zielony radar (`CRT Amber/Green glow`), surowy interfejs wojskowy połączony z nowoczesnymi, płynnymi przejściami.
*   **Humorystyczne komunikaty (Event Log):**
    *   If an asteroid hits Earth:
        *   *„Asteroida (2026 AB) uderzyła w lasy Ciemnego Kąta. Spłoszyła stado dzików i zniszczyła jeden paśnik. Straty: 500 Kredytów.”*
        *   *„Obiekt uderzył w rzekę San. Lokalne ryby zaczęły świecić na zielono. Brak ofiar w ludziach.”*
        *   *„Katastrofa! Asteroida zniszczyła zapasy drożdży w lokalnej piekarni. Brak chleba przez 2 dni!”*
    *   **Nazwy pocisków:** *Interkonektor HSW-1*, *Rakieta Grawitacyjna San-2*, *Szybki Kinetyk Borsuk*.

---

## 💬 3. KROK PO KROKU – SEKWENCJA PROMPTÓW DLA AI

Skopiuj i wklejaj te prompty po kolei w nowej sesji antigravity 2.0:

### 1️⃣ PROMPT 1: Radar UI i Fizyka Blipów (Faza 1)
```text
Set up a single-page React application with Tailwind CSS and Lucide React. We are building "NEO DEFENDER: COP Orbital Radar" - a tactical sci-fi defense game for Spaceshield Hack 2026, using live data from NASA.

Create a premium "tactical green CRT military monitor" design (Background: black #000000, UI borders and text: glowing retro phosphor green #00FF66, semi-transparent overlays).

Implement the core visual layout:
- Topbar: Title "COP ORBITAL RADAR // NEO DEFENSE GRID", active system clock, and "Credits: ✵ 0".
- Left Panel (60% width): The Tactical Radar Screen. Render a circular radar interface (CSS/SVG) centered in the container.
  * Implement a rotating radar sweep line (conic-gradient animation).
  * The center of the radar represents "Stalowa Wola Command Post" (a small shield icon).
  * Implement a system to spawn 5 mock "Asteroid Blips" at random angles and outer radiuses, which slowly move toward the center (Earth) over time. If they reach the center, they disappear and trigger a warning log event.
- Right Panel (40% width): Tactical Details. Clicking on a moving asteroid blip selects it, rendering a telemetry panel showing its ID, position, and mock coordinates. Include a prominent "FIRE DESTRUCTOR" button.

Ensure all animations are smooth and the CRT green phosphor style glows beautifully.
```

---

### 2️⃣ PROMPT 2: Integracja z NASA API (NeoWs Feed) (Faza 2)
```text
Now let's replace the mock asteroids with REAL space data using NASA's Near Earth Object API.

1. Fetch real-time space data on component mount. Calculate today's date formatted as YYYY-MM-DD and query NASA's Near Earth Object Web Service (NeoWs):
   `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=DEMO_KEY`

2. Parse the payload:
   - Extract the list of near-earth objects for today.
   - For each object, store: name (e.g. "(2024 JX)"), estimated_diameter (min/max in meters), relative_velocity (km/h), miss_distance (kilometers), and is_potentially_hazardous_asteroid (boolean).
   - Create a fallback mock array of 5 realistic asteroids in case the API limit is reached or the network is offline.

3. Map the NASA data to the Radar Blips:
   - Spawn these real asteroids as blips on the radar.
   - Scale their radar spawn distance based on their real 'miss_distance' (closer objects spawn closer to the center).
   - Scale their movement speed toward the center based on their real 'relative_velocity'.
   - When the user selects a blip on the radar, display its genuine NASA telemetry in the right panel:
     * Name, Estimated Diameter (in meters), Speed (km/h), Miss Distance (km), and Hazardous Flag.
     * Calculate a "Threat Score" (1-100) based on diameter and closeness.
```

---

### 3️⃣ PROMPT 3: Mechanika Strzelania i Detekcji Kolizji (Faza 3)
```text
Excellent! Let's implement the firing mechanics and scoring system.

1. Firing Interceptors:
   - When an asteroid blip is selected and the user clicks "FIRE DESTRUCTOR", trigger a projectile animation.
   - Draw a glowing green laser line (or a fast-moving missile sprite) starting from the radar center (Stalowa Wola) traveling directly to the target asteroid's current coordinates.
   - When the projectile reaches the target:
     * Trigger a visual particle explosion at the asteroid's coordinates.
     * Remove the asteroid from the active radar feed.
     * Play a simulated explosion sound (using Web Audio API).
     * Award the player Credits (✵) calculated as: `Base 100 + (Diameter in meters * 2)`.

2. Ground Impact (Defeat Conditions & Humorous Logs):
   - If an asteroid reaches the center of the radar (d = 0), it impacts Stalowa Wola.
   - Create a list of humorous local impact events, e.g.:
     * "Asteroida [Name] uderzyła w rzekę San! Lokalne ryby zaczęły świecić, a woda podniosła się o pół metra."
     * "Asteroida [Name] spadła na lasy Ciemnego Kąta, niszcząc paśnik dla saren. Straty: 500 Kredytów."
     * "Uderzenie! Obiekt wyparował ławkę w parku miejskim. Mieszkańcy są zdezorientowani."
   - Deduct Credits (or player lives) on impact. Display these event messages in a scrolling "Tactical Event Log" at the bottom of the right panel.
```

---

### 4️⃣ PROMPT 4: Sklep z Ulepszeniami, Autozapis i Audio (Faza 4)
```text
Let's finalize the game by building the upgrades system, saving progress, and adding 8-bit sound effects.

1. Upgrades Shop (Prawa kolumna - osobna zakładka):
   Gracy może wydać zdobyte Kredyty na następujące ulepszenia techniczne COP:
   - "Skaner Laserowy COP-3" (Cost: 300 ✵): Zwiększa zasięg wykrywania (radar sweep speed +50%).
   - "Działo Szynowe Borsuk" (Cost: 600 ✵): Zwiększa prędkość pocisków o 100%.
   - "Głowica Pierogowa" (Cost: 1000 ✵): Dodaje promień rażenia (niszczy sąsiednie asteroidy w promieniu 30px).
   - "Pole Grawitacyjne rzeki San" (Cost: 2000 ✵): Automatycznie niszczy pierwszą asteroidę, która przekroczy 15% promienia radaru (co 60 sekund).

2. Web Audio API Sounds (No external MP3 files):
   - Short "sonar ping" sweep sound every time the radar line crosses 0 degrees.
   - Laser "pew" sound when firing.
   - Explosive crunch sound when hitting a target.
   - Deep alarm buzz when a hazardous asteroid enters close proximity.
   - Add a Mute/Unmute button in the top bar.

3. State Persistence:
   - Save the player's credits, high score, and purchased upgrades to localStorage.
   - Add a "System Reset" button to clear progress.
```
