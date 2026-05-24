"// ===== NEO DEFENDER: COP SPACE SHOOTER - GAME ENGINE =====
(() => {
    'use strict';

    // ===== CONFIG =====
    const NASA_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed';
    const API_KEY = 'DEMO_KEY';
    const LUNAR_DISTANCE_KM = 384400;
    const PLAYER_SPEED = 280;
    const PLAYER_BULLET_SPEED = 600;
    const PLAYER_FIRE_RATE = 0.18; // seconds between shots
    const PLAYER_INVULN_TIME = 2; // seconds of invulnerability after hit
    const ASTEROID_BASE_SPEED = 60;
    const WAVE_BREAK = 4; // seconds between waves

    const IMPACT_MESSAGES = [
        'Asteroida [NAME] uderzyła w rzekę San! Lokalne ryby świecą na zielono.',
        'Obiekt [NAME] spadł na lasy Ciemnego Kąta, niszcząc paśnik dla saren. -500✵',
        'Uderzenie! [NAME] wyparował ławkę w parku miejskim. Mieszkańcy zdezorientowani.',
        'Katastrofa! [NAME] zniszczyła zapasy drożdży w piekarni. Brak chleba 2 dni!',
        '[NAME] uderzyła w parking przy HSW. Trzy Maluchy zniszczone.',
        'Obiekt [NAME] spadł na stadion. Mecz przerwany — najlepsza akcja sezonu.',
        '[NAME] trafiła w tory. Pociąg do Rzeszowa opóźniony o kolejne 3h.',
        '[NAME] zniszczyła fontannę na rynku. Woda bułgocze na fioletowo.',
        '[NAME] spadła na ogródki działkowe. Pan Henryk stracił dwa rzędy pomidorów.',
        'UWAGA! [NAME] zmiażdżyła jedyny bankomat w okolicy. Kolejka do następnego: 2 km.',
    ];
    const WEAPON_NAMES = ['Interkonektor HSW-1', 'Rakieta San-2', 'Szybki Kinetyk Borsuk', 'Pocisk COP-4', 'Głowica Stalowa-X'];

    const MOCK_ASTEROIDS = [
        { name:'(2026 SW1)', diameter_min:45, diameter_max:100, velocity:35000, miss_distance:5e6, hazardous:false },
        { name:'(2026 COP7)', diameter_min:120, diameter_max:270, velocity:52000, miss_distance:2e6, hazardous:true },
        { name:'467317 (2000 QW9)', diameter_min:200, diameter_max:450, velocity:78000, miss_distance:7.5e6, hazardous:true },
        { name:'(2026 AB3)', diameter_mi
<truncated 38807 bytes>