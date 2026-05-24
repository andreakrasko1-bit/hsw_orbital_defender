// ===== NEO DEFENDER: HSW ORBITAL DEFENDER =====
(() => {
    'use strict';

    // ===== CONFIG =====
    const NASA_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed';
    const API_KEY = 'DEMO_KEY';
    const LUNAR_DISTANCE_KM = 384400;
    const PLAYER_SPEED = 300;
    const PLAYER_BULLET_SPEED = 700;
    const PLAYER_FIRE_RATE = 0.15; // seconds between shots
    const ASTEROID_BASE_SPEED = 80;
    const WAVE_BREAK = 4; // seconds
    const CITY_SAVE_COST = 30; // coins to save normal city
    const BYDGOSZCZ_SAVE_COST = 50000; // coins for Bydgoszcz

    const IMPACT_MESSAGES = [
        'Asteroida [NAME] uderzyła w rzekę San! Lokalne ryby świecą na czerwono.',
        'Obiekt [NAME] spadł na lasy Ciemnego Kąta.',
        'Uderzenie! [NAME] wyparował ławkę w parku miejskim.',
        'Katastrofa! [NAME] zniszczyła zapasy w piekarni.',
        '[NAME] uderzyła w parking przy HSW. Trzy samochody zniszczone.',
        'Obiekt [NAME] spadł na stadion. Mecz przerwany.',
        '[NAME] trafiła w tory. Pociąg do Rzeszowa opóźniony o kolejne 3h.',
        '[NAME] spadła na ogródki działkowe.',
        'UWAGA! [NAME] zmiażdżyła jedyny bankomat w okolicy.',
    ];
    
    const MOCK_ASTEROIDS = [
        { name:'(2026 SW1)', diameter_min:45, diameter_max:100, velocity:35000, miss_distance:5e6, hazardous:false },
        { name:'(2026 COP7)', diameter_min:120, diameter_max:270, velocity:52000, miss_distance:2e6, hazardous:true },
        { name:'467317 (2000 QW9)', diameter_min:200, diameter_max:450, velocity:78000, miss_distance:7.5e6, hazardous:true },
        { name:'(2026 AB3)', diameter_min:20, diameter_max:50, velocity:22000, miss_distance:12e6, hazardous:false },
        { name:'(2026 NX1)', diameter_min:80, diameter_max:190, velocity:45000, miss_distance:3e6, hazardous:true },
        { name:'Bydgoszcz Bane', diameter_min:300, diameter_max:800, velocity:90000, miss_distance:1e5, hazardous:true }
    ];

    const CITIES = ['Warszawa', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Białystok', 'Katowice', 'Gdynia', 'Częstochowa', 'Radom', 'Toruń', 'Sosnowiec', 'Kielce', 'Rzeszów', 'Gliwice', 'Zabrze', 'Olsztyn', 'Bielsko-Biała', 'Bytom', 'Zielona Góra', 'Rybnik', 'Ruda Śląska', 'Tychy', 'Opole', 'Gorzów Wlkp.', 'Elbląg'];

    const UPGRADES = [
        { id: 'dmg', name: 'Działo Szynowe Borsuk', desc: 'Potężne pociski (8s)', cost: 45 },
        { id: 'rate', name: 'Szybki Kinetyk HSW', desc: 'Działko laserowe (8s)', cost: 65 },
        { id: 'speed', name: 'Silnik San-2', desc: 'Zwiększona prędkość (8s)', cost: 25 },
        { id: 'multishot', name: 'Interkonektor STW', desc: 'Ściana pocisków (8s)', cost: 85 },
        { id: 'shield', name: 'Tarcza Rozwadów', desc: 'Nietykalność (8s)', cost: 100 }
    ];

    // ===== STATE =====
    const state = {
        gameState: 'start', // start, playing, modal, gameover
        isWaveBreak: true,
        lastTime: 0,
        keys: {},
        wave: 0, // Zmieni się na 1 po pierwszym odliczaniu
        waveTimer: 0,
        waveTimeLeft: 0,
        gameTime: 0,
        score: 0,
        lives: 3,
        totalCoins: 0,
        destroyed: 0,
        playerNick: 'HSW_PILOT',
        shipLevel: 1,
        nasaData: [],
        asteroids: [],
        bullets: [],
        particles: [],
        coins: [],
        stars: [],
        floatingTexts: [],
        shakeIntensity: 0,
        savedCities: [],
        destroyedCities: [],
        activeBuffs: { dmg:0, rate:0, speed:0, multishot:0, shield:0 },
        player: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, shootTimer: 0, invuln: 0 },
        bossActive: false,
        mouseX: 0, mouseY: 0, isMouseDown: false
    };

    // ===== MATH & UTILS =====
    const rand = (min, max) => Math.random() * (max - min) + min;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

    // ===== DOM =====
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    let cw, ch;
    
    // Resize
    function resize() {
        cw = canvas.parentElement.clientWidth;
        ch = canvas.parentElement.clientHeight;
        canvas.width = cw;
        canvas.height = ch;
        if(state.player.x === 0 && state.player.y === 0) {
            state.player.x = cw / 2;
            state.player.y = ch - 100;
        }
        generateStars();
    }
    window.addEventListener('resize', resize);
    resize();
    
    function logEvent(msg, type='system') {
        const log = document.getElementById('event-log');
        const el = document.createElement('div');
        el.className = `log-entry ${type}`;
        el.innerHTML = `[${new Date().toLocaleTimeString('pl-PL', {hour12:false})}] ${msg}`;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        if(log.children.length > 20) log.removeChild(log.firstChild);
    }

    function formatNumber(n) { return new Intl.NumberFormat('pl-PL').format(Math.floor(n)); }
    function calcThreat(diam, miss) { return Math.min(100, Math.max(1, Math.round((diam / 500) * 50 + (1e7 / Math.max(1, miss)) * 50))); }

    // ===== HUD UPDATES =====
    function updateHUD() {
        const m = Math.floor(state.gameTime / 60).toString().padStart(2, '0');
        const s = Math.floor(state.gameTime % 60).toString().padStart(2, '0');
        document.getElementById('clock-value').innerText = `${m}:${s}`;
        document.getElementById('wave-value').innerText = Math.max(1, state.wave); // Nie pokazuj fali 0
        document.getElementById('lives-value').innerText = '♥'.repeat(state.lives);
        document.getElementById('lives-value').style.color = '#FF0000'; // Pure red
        document.getElementById('score-value').innerText = `${state.score}`;
        document.getElementById('coins-right-value').innerText = `${state.totalCoins}`;
        document.getElementById('level-value').innerText = `LVL ${state.shipLevel}`;
        
        // Update shop button colors and timers dynamically
        document.querySelectorAll('.shop-buy-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            const id = btn.dataset.id;
            
            if (state.activeBuffs[id] > 0) {
                btn.innerText = state.activeBuffs[id].toFixed(1) + 's';
                btn.style.opacity = '1';
                btn.style.border = '2px solid #FFD700';
            } else {
                btn.innerText = cost + ' COINÓW';
                btn.style.border = '';
                if(state.totalCoins < cost) btn.style.opacity = '0.4';
                else btn.style.opacity = '1';
            }
        });

        // Update active buffs HUD
        const buffsContainer = document.getElementById('active-upgrades');
        if (buffsContainer) {
            let html = '';
            for (let k in state.activeBuffs) {
                if (state.activeBuffs[k] > 0) {
                    const upg = UPGRADES.find(u => u.id === k);
                    html += `<div style="margin-bottom:5px; font-size:12px; color:#FFD700;">
                        ${upg.name}: <span style="color:#FF0000">${state.activeBuffs[k].toFixed(1)}s</span>
                    </div>`;
                }
            }
            buffsContainer.innerHTML = html;
        }

        // Telemetry update
        if (state.asteroids.length > 0) {
            document.getElementById('no-selection').classList.add('hidden');
            document.getElementById('telemetry-card').classList.remove('hidden');
            
            // Find closest asteroid
            let closest = state.asteroids[0];
            let minDist = dist(closest.x, closest.y, state.player.x, state.player.y);
            for(let i=1; i<state.asteroids.length; i++) {
                let d = dist(state.asteroids[i].x, state.asteroids[i].y, state.player.x, state.player.y);
                if(d < minDist) { minDist = d; closest = state.asteroids[i]; }
            }
            
            document.getElementById('tele-name').innerText = closest.data.name;
            document.getElementById('tele-diameter').innerText = `${closest.data.diameter_min}-${closest.data.diameter_max} m`;
            document.getElementById('tele-speed').innerText = `${formatNumber(closest.data.velocity)} km/h`;
            document.getElementById('tele-distance').innerText = `${formatNumber(closest.data.miss_distance)} km`;
            document.getElementById('tele-ld').innerText = (closest.data.miss_distance / LUNAR_DISTANCE_KM).toFixed(2);
            document.getElementById('threat-score-val').innerText = closest.threat;
            document.getElementById('threat-bar').style.width = closest.threat + '%';
            document.getElementById('threat-bar').style.backgroundColor = closest.threat > 70 ? '#FF0000' : '#FFD700';
            
            if (closest.data.hazardous) {
                document.getElementById('hazard-badge').classList.remove('hidden');
            } else {
                document.getElementById('hazard-badge').classList.add('hidden');
            }
        } else {
            document.getElementById('no-selection').classList.remove('hidden');
            document.getElementById('telemetry-card').classList.add('hidden');
        }
    }

    function showBrokenHeartAnimation(x, y) {
        const div = document.createElement('div');
        div.innerText = '💔';
        div.style.position = 'absolute';
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.fontSize = '50px';
        div.style.pointerEvents = 'none';
        div.style.transition = 'all 1.5s ease-out';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.zIndex = '1000';
        document.getElementById('game-section').appendChild(div);
        
        // Trigger animation
        setTimeout(() => {
            div.style.top = (y - 150) + 'px';
            div.style.opacity = '0';
            div.style.transform = 'translate(-50%, -50%) scale(1.5)';
        }, 50);

        setTimeout(() => div.remove(), 1600);
    }

    // ===== GRAPHICS & PARTICLES =====
    function generateStars() {
        state.stars = [];
        for(let i=0; i<150; i++) {
            const layer = Math.random() < 0.6 ? 1 : (Math.random() < 0.9 ? 2 : 3);
            state.stars.push({
                x: rand(0, cw),
                y: rand(0, ch),
                size: layer,
                speed: layer * 15,
                alpha: layer * 0.3
            });
        }
    }

    function spawnExplosion(x, y, color, count, speedFactor=1) {
        for(let i=0; i<count; i++) {
            const angle = rand(0, Math.PI*2);
            const s = rand(20, 150) * speedFactor;
            state.particles.push({
                x, y, vx: Math.cos(angle)*s, vy: Math.sin(angle)*s,
                life: rand(0.5, 1.2), maxLife: 1.2,
                color, size: rand(2, 6)
            });
        }
    }

    function spawnCoin(x, y, amount) {
        state.coins.push({ x, y, vx: rand(-50,50), vy: rand(-50,50), life: 4, amount });
    }

    function spawnFloatingText(x, y, text, color) {
        state.floatingTexts.push({ x, y, text, color, life: 1 });
    }

    // ===== GAME LOGIC =====
    function spawnWave() {
        state.waveTimer = WAVE_BREAK;
        state.isWaveBreak = true;
        state.gameState = 'playing';
        logEvent(`Przygotowanie do startu...`, 'system');
    }

    function generateAsteroid(forceBoss = false) {
        const isBoss = forceBoss || (state.wave % 5 === 0 && state.bossActive === false && Math.random() < 0.1);
        if (isBoss) state.bossActive = true;

        const data = MOCK_ASTEROIDS[Math.floor(rand(0, MOCK_ASTEROIDS.length))];
        let avgDiam = (data.diameter_min + data.diameter_max) / 2;
        let size = clamp(avgDiam / 10, 15, 60);
        let hp = Math.ceil(size / 10) + state.wave;

        if (isBoss) {
            size *= 2.5;
            hp *= 10;
        }

        const angle = rand(0, Math.PI);
        const spawnDist = cw / 2 + 100;
        const x = cw / 2 + Math.cos(angle) * spawnDist;
        const y = -100;
        
        const speed = 40 + state.wave * 8;
        const targetX = cw/2 + rand(-cw/3, cw/3);
        const targetY = ch;
        const angleToTarget = Math.atan2(targetY - y, targetX - x);

        // Generate rocky vertices
        const vertices = [];
        const numPoints = Math.floor(rand(8, 14));
        for(let i=0; i<numPoints; i++) {
            const a = (i/numPoints) * Math.PI * 2;
            const r = size * rand(0.7, 1.1);
            vertices.push({x: Math.cos(a)*r, y: Math.sin(a)*r});
        }

        state.asteroids.push({
            x, y, vx: Math.cos(angleToTarget)*speed, vy: Math.sin(angleToTarget)*speed,
            size, hp, maxHp: hp, isBoss, data,
            threat: calcThreat(avgDiam, data.miss_distance),
            rot: rand(0, Math.PI*2), rotSpeed: rand(-1, 1),
            vertices: vertices,
            flashTimer: 0
        });
    }

    function fireBullet() {
        if (state.player.shootTimer > 0) return;
        state.player.shootTimer = PLAYER_FIRE_RATE / (state.activeBuffs.rate > 0 ? 3.5 : 1); 
        if(window.AudioEngine && window.AudioEngine.laserFire) window.AudioEngine.laserFire();

        const dmg = state.activeBuffs.dmg > 0 ? 15 : 1; 
        const speeds = [0];
        if (state.activeBuffs.multishot > 0) speeds.push(-15, 15, -30, 30, -45, 45); 

        for(let offset of speeds) {
            const angle = state.player.rot - Math.PI/2 + (offset * Math.PI / 180);
            state.bullets.push({
                x: state.player.x + Math.cos(angle)*20,
                y: state.player.y + Math.sin(angle)*20,
                vx: Math.cos(angle) * PLAYER_BULLET_SPEED,
                vy: Math.sin(angle) * PLAYER_BULLET_SPEED,
                dmg, size: 4
            });
        }
    }

    // ===== MODALS & CITIES =====
    function triggerCityImpact(asteroid) {
        state.gameState = 'modal';
        
        let city = '';
        const rnd = Math.random();
        if (rnd < 0.13) {
            city = 'Stalowa Wola';
        } else if (rnd < 0.53) { // 40% chance for large cities
            const bigCities = ['Warszawa', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk'];
            city = bigCities[Math.floor(rand(0, bigCities.length))];
        } else {
            const others = CITIES.filter(c => !['Stalowa Wola', 'Warszawa', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk'].includes(c));
            city = others[Math.floor(rand(0, others.length))];
        }

        const isBydgoszcz = city === 'Bydgoszcz';
        const isStalowaWola = city === 'Stalowa Wola';
        const costInflation = state.savedCities.length * 50; // Każde kolejne miasto jest o 50 coinów droższe
        const cost = isStalowaWola ? 0 : (isBydgoszcz ? BYDGOSZCZ_SAVE_COST + costInflation : CITY_SAVE_COST + costInflation);
        
        const msgTpl = IMPACT_MESSAGES[Math.floor(rand(0, IMPACT_MESSAGES.length))];
        const descText = msgTpl.replace('[NAME]', asteroid.data.name);

        document.getElementById('city-modal-title').innerText = `UDERZENIE W: ${city.toUpperCase()}!`;
        document.getElementById('city-modal-title').style.color = '#FF0000';
        document.getElementById('city-modal-desc').innerHTML = `${descText}<br><br>Koszt ratunku: <span style="color:#FFD700">${cost} coinów</span>`;
        
        const btns = document.getElementById('city-modal-buttons');
        btns.innerHTML = '';
        
        const btnSave = document.createElement('button');
        btnSave.className = 'fire-button';
        btnSave.innerText = `RATUJ (${cost})`;
        btnSave.onclick = () => {
            if (state.totalCoins >= cost) {
                state.totalCoins -= cost;
                state.savedCities.push(city);
                
                state.lives = isStalowaWola ? 2 : 1; // 2 życia za Stalową Wolę, 1 za inne miasta
                logEvent(`Uratowano ${city}! Statek przywrócony.`, 'good');
                closeModal();
            } else {
                if (isStalowaWola) {
                    // Brak środków na ratowanie Stalowej Woli oznacza od razu koniec gry
                    logEvent(`Brak środków na obronę Stalowej Woli!`, 'threat');
                    closeModal();
                    gameOver(city);
                } else {
                    btnSave.innerText = 'BRAK ŚRODKÓW!';
                    btnSave.style.background = '#FF0000';
                }
            }
        };

        btns.appendChild(btnSave);

        if (!isStalowaWola) {
            const btnDestroy = document.createElement('button');
            btnDestroy.className = 'fire-button';
            btnDestroy.style.background = '#660000';
            btnDestroy.innerText = 'NIE BROŃ MIASTA (0)';
            btnDestroy.onclick = () => {
                state.destroyedCities.push(city);
                logEvent(`${city} ZNISZCZONE!`, 'threat');
                if(window.AudioEngine && window.AudioEngine.explosion) window.AudioEngine.explosion();
                closeModal();
                gameOver(city);
            };
            btns.appendChild(btnDestroy);
        }
        document.getElementById('city-modal').classList.remove('hidden');
    }

    function closeModal() {
        document.getElementById('city-modal').classList.add('hidden');
        state.gameState = 'playing';
        updateHUD();
    }

    function gameOver(city, isSacrifice = false) {
        state.gameState = 'gameover';
        if (city) {
            if (isSacrifice) {
                document.getElementById('game-over-title').innerText = `BOHATERSKIE POŚWIĘCENIE DLA: ${city.toUpperCase()}`;
            } else {
                document.getElementById('game-over-title').innerText = `METEOR UDERZYŁ W: ${city.toUpperCase()}`;
            }
        }
        document.getElementById('game-over-overlay').classList.remove('hidden');
        document.getElementById('game-over-stats').innerHTML = `
            Fala: <span style="color:#FF0000">${state.wave}</span><br>
            Zniszczone obiekty: <span style="color:#FFD700">${state.destroyed}</span><br>
            Wynik: <span style="color:#FFD700">${state.score}</span><br>
            Uratowane miasta: <span style="color:#00FF00">${state.savedCities.length > 0 ? [...new Set(state.savedCities)].sort((a, b) => a.localeCompare(b, 'pl')).join(', ') : 'Brak'}</span>
        `;
        saveAndRenderLeaderboard(state.playerNick, state.score);
    }

    function saveAndRenderLeaderboard(newNick, newScore) {
        let lb = JSON.parse(localStorage.getItem('hsw_leaderboard') || '[]');
        if (newNick && newScore > 0) {
            lb.push({nick: newNick, score: newScore});
            lb.sort((a,b) => b.score - a.score);
            lb = lb.slice(0, 10);
            localStorage.setItem('hsw_leaderboard', JSON.stringify(lb));
        }
        
        let html = '<div style="text-align: center;">';
        html += '<div class="leaderboard-title" style="color:#FFD700; margin-bottom:10px;">TOP PILOCI</div>';
        if (lb.length === 0) html += '<div>Brak rekordów</div>';
        lb.forEach((e, i) => {
            html += `<div>${i+1}. <span style="color:#FF0000">${e.nick}</span> - <span style="color:#FFD700">${e.score}</span></div>`;
        });
        html += '</div>';
        
        const elStart = document.getElementById('leaderboard-start');
        const elOver = document.getElementById('leaderboard-gameover');
        if (elStart) elStart.innerHTML = html;
        if (elOver) elOver.innerHTML = html;
    }

    // ===== SHOP =====
    function toggleShop() {
        const shop = document.getElementById('shop-tab');
        const tele = document.getElementById('telemetry-tab');
        if (shop.classList.contains('hidden')) {
            shop.classList.remove('hidden');
            tele.classList.add('hidden');
            document.querySelector('[data-tab="shop"]').classList.add('active');
            document.querySelector('[data-tab="telemetry"]').classList.remove('active');
            renderShop();
        } else {
            shop.classList.add('hidden');
            tele.classList.remove('hidden');
            document.querySelector('[data-tab="shop"]').classList.remove('active');
            document.querySelector('[data-tab="telemetry"]').classList.add('active');
        }
    }

    function renderShop() {
        const cont = document.getElementById('shop-items');
        cont.innerHTML = '';
        UPGRADES.forEach(u => {
            const cost = u.cost;
            const isActive = state.activeBuffs[u.id] > 0;
            
            const el = document.createElement('div');
            el.className = 'shop-item';
            el.innerHTML = `
                <div style="flex:1">
                    <strong style="color:#FF0000">${u.name}</strong><br>
                    <small>${u.desc}</small>
                </div>
                <button class="fire-button shop-buy-btn" data-id="${u.id}" data-cost="${cost}" style="padding: 5px 10px; font-size:12px;">
                    ${cost} COINÓW
                </button>
            `;
            const btn = el.querySelector('button');
            btn.onclick = () => {
                if (state.totalCoins >= cost) {
                    state.totalCoins -= cost;
                    state.activeBuffs[u.id] += 8; // 8 sekund czasu!
                    if(window.AudioEngine && window.AudioEngine.purchase) window.AudioEngine.purchase();
                    renderShop();
                    updateHUD();
                } else {
                    btn.style.background = '#660000';
                    setTimeout(() => btn.style.background = '', 200);
                }
            };
            cont.appendChild(el);
        });
    }

    // ===== MAIN LOOP =====
    function update(dt) {
        if (state.gameState === 'start' || state.gameState === 'modal' || state.gameState === 'gameover') return;

        state.gameTime += dt;

        if (state.isWaveBreak) {
            state.waveTimer -= dt;
            if (state.waveTimer <= 0) {
                state.wave++;
                state.waveTimeLeft = 15 + state.wave * 2; // Fale stają się dłuższe
                state.isWaveBreak = false;
                logEvent(`Fala ${state.wave} rozpoczęta! Czas trwania: ${state.waveTimeLeft}s`, 'good');
                
                if (state.wave % 5 === 0) {
                    generateAsteroid(true); // Spawn Boss!
                    logEvent(`UWAGA! Zbliża się obiekt klasy BOSS!`, 'threat');
                }
            }
        } else {
            state.waveTimeLeft -= dt;
            if (state.waveTimeLeft <= 0) {
                state.isWaveBreak = true;
                state.waveTimer = WAVE_BREAK;
                logEvent(`Fala ${state.wave} odparta!`, 'good');
            }
        }

        // Odliczanie czasu buffów
        for (let k in state.activeBuffs) {
            if (state.activeBuffs[k] > 0) {
                state.activeBuffs[k] = Math.max(0, state.activeBuffs[k] - dt);
            }
        }

        // Player movement
        const speed = PLAYER_SPEED * (state.activeBuffs.speed > 0 ? 1.8 : 1);
        let dx = 0, dy = 0;
        if (state.keys['w'] || state.keys['arrowup']) dy -= 1;
        if (state.keys['s'] || state.keys['arrowdown']) dy += 1;
        if (state.keys['a'] || state.keys['arrowleft']) dx -= 1;
        if (state.keys['d'] || state.keys['arrowright']) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            state.player.x += (dx/len) * speed * dt;
            state.player.y += (dy/len) * speed * dt;
        }
        state.player.x = clamp(state.player.x, 20, cw-20);
        state.player.y = clamp(state.player.y, 20, ch-20);

        // Player aim & shoot
        state.player.rot = Math.atan2(state.mouseY - state.player.y, state.mouseX - state.player.x) + Math.PI/2;
        if (state.player.shootTimer > 0) state.player.shootTimer -= dt;
        if (state.player.invuln > 0) state.player.invuln -= dt;
        if (state.isMouseDown || state.keys[' ']) fireBullet();

        // Spawn Asteroids - easier on early waves. ONLY spawn if NOT in wave_break
        if (!state.isWaveBreak) {
            const spawnChance = 0.005 + (state.wave * 0.003);
            if (Math.random() < spawnChance) generateAsteroid();
        }

        // Update Bullets
        for(let i=state.bullets.length-1; i>=0; i--) {
            let b = state.bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < 0 || b.x > cw || b.y < 0 || b.y > ch) {
                state.bullets.splice(i, 1);
            }
        }

        // Update Asteroids
        state.bossActive = false;
        for(let i=state.asteroids.length-1; i>=0; i--) {
            let a = state.asteroids[i];
            if (a.isBoss) state.bossActive = true;
            if (a.flashTimer > 0) a.flashTimer -= dt;
            
            a.x += a.vx * dt;
            a.y += a.vy * dt;
            a.rot += a.rotSpeed * dt;

            // Boundaries
            if (a.isBoss) {
                if (a.x - a.size < 0) { a.x = a.size; a.vx *= -1; }
                if (a.x + a.size > cw) { a.x = cw - a.size; a.vx *= -1; }
                if (a.y + a.size > ch) { a.y = ch - a.size; a.vy *= -1; }
                if (a.y - a.size < 0 && a.vy < 0) { a.y = a.size; a.vy *= -1; }
            } else {
                if (a.y > ch + a.size) {
                    state.asteroids.splice(i, 1);
                    continue;
                }
                if (a.x < -100 || a.x > cw+100) {
                    state.asteroids.splice(i, 1);
                    continue;
                }
            }

            // Bullet collision
            for(let j=state.bullets.length-1; j>=0; j--) {
                let b = state.bullets[j];
                if (dist(a.x, a.y, b.x, b.y) < a.size + b.size) {
                    state.bullets.splice(j, 1);
                    a.hp -= b.dmg;
                    if (a.isBoss) a.flashTimer = 0.15; // Błysk tylko dla bossa
                    spawnExplosion(b.x, b.y, '#FFD700', 5, 0.5);
                    if (a.hp <= 0) {
                        spawnExplosion(a.x, a.y, '#FF0000', a.size, 1.5);
                        if(a.isBoss) state.shakeIntensity = 30; // Trzęsienie po śmierci bossa
                        const coinAmount = a.isBoss ? 200 : Math.ceil(a.size);
                        spawnCoin(a.x, a.y, coinAmount);
                        state.score += a.isBoss ? 500 : 10;
                        state.destroyed++;
                        state.asteroids.splice(i, 1);
                        if(window.AudioEngine && window.AudioEngine.explosion) window.AudioEngine.explosion();
                        break; // asteroid dead
                    }
                }
            }

            // Player collision
            if (a.hp > 0 && state.player.invuln <= 0 && dist(a.x, a.y, state.player.x, state.player.y) < a.size + 15) {
                if (state.activeBuffs.shield > 0) {
                    // Nietykalność niszczy asteroidę bez obrażeń
                    spawnExplosion(a.x, a.y, '#00FFFF', a.size, 1.5);
                    state.asteroids.splice(i, 1);
                    if(window.AudioEngine && window.AudioEngine.explosion) window.AudioEngine.explosion();
                    continue;
                }

                state.lives--;
                state.shakeIntensity = 20;
                state.player.invuln = 2;
                spawnExplosion(state.player.x, state.player.y, '#FF0000', 30);
                if(window.AudioEngine && window.AudioEngine.explosion) window.AudioEngine.explosion();
                
                // Zniszcz asteroidę przy zderzeniu!
                spawnExplosion(a.x, a.y, '#FF0000', a.size, 1.5);
                state.asteroids.splice(i, 1);

                if (state.lives <= 0) {
                    triggerCityImpact(a);
                } else {
                    showBrokenHeartAnimation(state.player.x, state.player.y);
                }
            }
        }

        // Update Coins
        for(let i=state.coins.length-1; i>=0; i--) {
            let c = state.coins[i];
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.life -= dt;
            c.vx *= 0.95; c.vy *= 0.95;
            
            if (dist(c.x, c.y, state.player.x, state.player.y) < 60) {
                // magnetism
                const angle = Math.atan2(state.player.y - c.y, state.player.x - c.x);
                c.vx += Math.cos(angle) * 400 * dt;
                c.vy += Math.sin(angle) * 400 * dt;
            }

            if (dist(c.x, c.y, state.player.x, state.player.y) < 25) {
                state.totalCoins += c.amount;
                spawnFloatingText(c.x, c.y, '+' + c.amount, '#FFD700'); // Latające liczby!
                state.coins.splice(i, 1);
                if(window.AudioEngine && window.AudioEngine.purchase) window.AudioEngine.purchase();
            } else if (c.life <= 0) {
                state.coins.splice(i, 1);
            }
        }

        // Update Particles
        for(let i=state.particles.length-1; i>=0; i--) {
            let p = state.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) state.particles.splice(i, 1);
        }

        // Update Floating Texts
        for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
            let t = state.floatingTexts[i];
            t.y -= 40 * dt;
            t.life -= dt;
            if (t.life <= 0) state.floatingTexts.splice(i, 1);
        }

        if (state.shakeIntensity > 0) {
            state.shakeIntensity = Math.max(0, state.shakeIntensity - dt * 50);
        }

        updateHUD();
    }

    function draw() {
        ctx.save();
        if (state.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * state.shakeIntensity;
            const dy = (Math.random() - 0.5) * state.shakeIntensity;
            ctx.translate(dx, dy);
        }
        
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, cw, ch);
        
        // Stars
        state.stars.forEach(s => {
            s.y += s.speed * 0.05;
            if(s.y > ch) s.y = 0;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Coins
        state.coins.forEach(c => {
            if (c.life < 1.5 && Math.floor(Date.now() / 100) % 2 === 0) return; // Blink before disappearing
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 6, 0, Math.PI*2);
            ctx.fill();
        });

        // Particles
        state.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        // Bullets
        ctx.fillStyle = '#FFD700';
        state.bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI*2);
            ctx.fill();
        });

        // Asteroids
        state.asteroids.forEach(a => {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rot);
            
            // Asteroid Body
            let baseFill = a.isBoss ? '#330000' : '#1a1a1a';
            let flashFill = a.isBoss ? '#1a0000' : '#1a1a1a'; 
            ctx.fillStyle = (a.isBoss && a.flashTimer > 0) ? flashFill : baseFill;
            
            let baseStroke = a.isBoss ? '#FF0000' : '#FFD700';
            let flashStroke = a.isBoss ? '#AA0000' : '#FFD700';
            ctx.strokeStyle = (a.isBoss && a.flashTimer > 0) ? flashStroke : baseStroke;
            
            ctx.lineWidth = a.isBoss ? 4 : 2;
            
            ctx.beginPath();
            a.vertices.forEach((v, i) => {
                if (i === 0) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Inner rocky details
            ctx.strokeStyle = '#331a1a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.vertices[0].x*0.5, a.vertices[0].y*0.5);
            ctx.lineTo(a.vertices[Math.floor(a.vertices.length/3)].x*0.6, a.vertices[Math.floor(a.vertices.length/3)].y*0.6);
            ctx.lineTo(a.vertices[Math.floor(a.vertices.length*2/3)].x*0.5, a.vertices[Math.floor(a.vertices.length*2/3)].y*0.5);
            ctx.stroke();

            // Health bar
            if(a.hp < a.maxHp) {
                ctx.rotate(-a.rot);
                ctx.fillStyle = '#660000';
                ctx.fillRect(-a.size, -a.size-15, a.size*2, 4);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(-a.size, -a.size-15, (a.size*2) * (a.hp/a.maxHp), 4);
            }
            ctx.restore();
        });

        // Player
        if (state.gameState === 'playing') {
            ctx.save();
            ctx.translate(state.player.x, state.player.y);
            ctx.rotate(state.player.rot);
            if (state.player.invuln > 0 && Math.floor(Date.now()/100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            // Ship drawing (Red)
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(15, 15);
            ctx.lineTo(0, 5);
            ctx.lineTo(-15, 15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Engine glow
            if (state.keys['w'] || state.keys['arrowup']) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(-5, 10);
                ctx.lineTo(5, 10);
                ctx.lineTo(0, 25 + rand(0,10));
                ctx.fill();
            }
            ctx.restore();
        }

        // Crosshair
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(state.mouseX, state.mouseY, 10, 0, Math.PI*2);
        ctx.moveTo(state.mouseX-15, state.mouseY); ctx.lineTo(state.mouseX+15, state.mouseY);
        ctx.moveTo(state.mouseX, state.mouseY-15); ctx.lineTo(state.mouseX, state.mouseY+15);
        ctx.stroke();

        // Wave text / active buffs on screen
        if (state.isWaveBreak) {
            ctx.fillStyle = '#FF0000';
            ctx.font = '40px Orbitron';
            ctx.textAlign = 'center';
            if (state.wave === 0) {
                ctx.fillText(`PRZYGOTUJ SIĘ`, cw/2, ch/2 - 40);
                ctx.font = '20px Orbitron';
                ctx.fillStyle = '#FFD700';
                ctx.fillText(`Start za ${Math.ceil(state.waveTimer)}s`, cw/2, ch/2 + 10);
            } else {
                ctx.fillText(`FALA ${state.wave + 1}`, cw/2, ch/2 - 40);
                ctx.font = '20px Orbitron';
                ctx.fillStyle = '#FFD700';
                ctx.fillText(`Zbliża się za ${Math.ceil(state.waveTimer)}s`, cw/2, ch/2 + 10);
            }
        }

        // Draw floating texts
        state.floatingTexts.forEach(t => {
            ctx.globalAlpha = Math.max(0, t.life);
            ctx.fillStyle = t.color;
            ctx.font = 'bold 16px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
        });
        ctx.globalAlpha = 1;

        ctx.restore(); // Restore shake translation
    }

    function loop(time) {
        const dt = (time - state.lastTime) / 1000;
        state.lastTime = time;
        if (dt < 0.1) {
            update(dt);
            draw();
        }
        requestAnimationFrame(loop);
    }

    // ===== INPUT =====
    window.addEventListener('keydown', e => {
        state.keys[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === 'e') toggleShop();
    });
    window.addEventListener('keyup', e => state.keys[e.key.toLowerCase()] = false);
    
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        state.mouseX = e.clientX - rect.left;
        state.mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', () => state.isMouseDown = true);
    canvas.addEventListener('mouseup', () => state.isMouseDown = false);

    // ===== INIT =====
    document.getElementById('start-btn').onclick = () => {
        const nick = document.getElementById('nick-input').value.trim();
        if (nick) state.playerNick = nick;
        document.getElementById('start-overlay').classList.add('hidden');
        state.gameState = 'playing';
        if(window.AudioEngine) window.AudioEngine.init();
        spawnWave();
    };

    document.getElementById('restart-btn').onclick = () => {
        location.reload();
    };

    // UI Tab Listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(btn.dataset.tab === 'shop') toggleShop();
            else {
                document.getElementById('shop-tab').classList.add('hidden');
                document.getElementById('telemetry-tab').classList.remove('hidden');
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // Initial render
    updateHUD();
    saveAndRenderLeaderboard();
    requestAnimationFrame(t => { state.lastTime = t; loop(t); });

})();