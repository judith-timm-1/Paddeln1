/*
=========================================
Wilstermarsch Wetter- und Wasserportal
=========================================
*/

/*
Open-Meteo
Koordinaten Wilster:
54.00 / 9.37
*/

const LAT = 54.00;
const LON = 9.37;

const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");

const refreshBtn = document.getElementById("refreshBtn");

function showLoader() {
    loader.classList.add("active");
}

function hideLoader() {
    loader.classList.remove("active");
}

function beaufort(speedKmh) {

    if (speedKmh < 1) return 0;
    if (speedKmh < 6) return 1;
    if (speedKmh < 12) return 2;
    if (speedKmh < 20) return 3;
    if (speedKmh < 29) return 4;
    if (speedKmh < 39) return 5;
    if (speedKmh < 50) return 6;
    if (speedKmh < 62) return 7;
    if (speedKmh < 75) return 8;
    if (speedKmh < 89) return 9;
    if (speedKmh < 103) return 10;
    if (speedKmh < 118) return 11;

    return 12;
}

function windDirection(deg) {

    const directions = [
        "N", "NO", "O", "SO",
        "S", "SW", "W", "NW"
    ];

    return directions[
        Math.round(deg / 45) % 8
    ];
}

function weatherDescription(code) {

    const map = {
        0: "Klar",
        1: "Überwiegend klar",
        2: "Leicht bewölkt",
        3: "Bewölkt",
        45: "Nebel",
        48: "Raureifnebel",
        51: "Leichter Nieselregen",
        53: "Nieselregen",
        55: "Starker Nieselregen",
        61: "Leichter Regen",
        63: "Regen",
        65: "Starker Regen",
        80: "Regenschauer",
        81: "Starke Schauer",
        95: "Gewitter"
    };

    return map[code] || "Unbekannt";
}

async function loadWeather() {

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=precipitation_probability`;

    const response = await fetch(url);

    if (!response.ok) throw new Error();

    return await response.json();
}

/*
=================================
Kostenlose Tide API
=================================

WorldTides bietet kostenlose Nutzung
nach Registrierung.

API KEY einsetzen:
*/

const TIDE_API_KEY = "DEIN_API_KEY_HIER";

async function loadTides() {

    try {

        const response = await fetch(
            `https://www.worldtides.info/api/v3?heights&extremes&lat=${LAT}&lon=${LON}&key=${TIDE_API_KEY}`
        );

        if (!response.ok) {
            throw new Error();
        }

        return await response.json();

    } catch {

        /*
        Fallback-Dummywerte
        */

        return {
            highTide: "15:42",
            lowTide: "21:36",
            level: "2.8 m",
            trend: "steigend"
        };
    }
}

function updateRecommendation(
    wind,
    rainProb,
    weatherCode
) {

    const card =
        document.getElementById(
            "recommendationText"
        );

    const strongRain =
        weatherCode === 65 ||
        weatherCode === 80 ||
        weatherCode === 81 ||
        weatherCode === 95;

    if (
        wind < 20 &&
        rainProb < 60 &&
        !strongRain
    ) {

        card.className = "good";

        card.innerHTML =
            "✅ Gute Bedingungen für eine Tour";

    } else if (wind < 35) {

        card.className = "warning";

        card.innerHTML =
            "⚠️ Achtung ist geboten";

    } else {

        card.className = "bad";

        card.innerHTML =
            "❌ Heute besser nicht aufs Wasser";
    }
}

async function loadAllData() {

    try {

        errorBox.classList.add("hidden");
        showLoader();

        const weather =
            await loadWeather();

        const current =
            weather.current;

        document.getElementById("temp")
            .textContent =
            `${current.temperature_2m} °C`;

        document.getElementById("weather")
            .textContent =
            weatherDescription(
                current.weather_code
            );

        document.getElementById("humidity")
            .textContent =
            `${current.relative_humidity_2m}%`;

        const rainProbability =
            weather.hourly
                .precipitation_probability[0];

        document.getElementById("rain")
            .textContent =
            `${rainProbability}%`;

        document.getElementById("windspeed")
            .textContent =
            `${current.wind_speed_10m} km/h`;

        document.getElementById("beaufort")
            .textContent =
            beaufort(
                current.wind_speed_10m
            );

        document.getElementById("winddir")
            .textContent =
            windDirection(
                current.wind_direction_10m
            );

        document.getElementById("gusts")
            .textContent =
            `${current.wind_gusts_10m} km/h`;

        const tideData =
            await loadTides();

        if (tideData.extremes) {

            const highs =
                tideData.extremes
                    .filter(
                        x => x.type === "High"
                    );

            const lows =
                tideData.extremes
                    .filter(
                        x => x.type === "Low"
                    );

            document.getElementById(
                "highTide"
            ).textContent =
                highs.length
                ? new Date(
                    highs[0].dt * 1000
                  ).toLocaleTimeString(
                    "de-DE",
                    {
                      hour: "2-digit",
                      minute: "2-digit"
                    }
                  )
                : "--";

            document.getElementById(
                "lowTide"
            ).textContent =
                lows.length
                ? new Date(
                    lows[0].dt * 1000
                  ).toLocaleTimeString(
                    "de-DE",
                    {
                      hour: "2-digit",
                      minute: "2-digit"
                    }
                  )
                : "--";

            document.getElementById(
                "waterLevel"
            ).textContent =
                "API-Wert";

            document.getElementById(
                "trend"
            ).textContent =
                "laufend";
        }
        else {

            document.getElementById(
                "highTide"
            ).textContent =
                tideData.highTide;

            document.getElementById(
                "lowTide"
            ).textContent =
                tideData.lowTide;

            document.getElementById(
                "waterLevel"
            ).textContent =
                tideData.level;

            document.getElementById(
                "trend"
            ).textContent =
                tideData.trend;
        }

        updateRecommendation(
            current.wind_speed_10m,
            rainProbability,
            current.weather_code
        );

        document.getElementById(
            "last-update"
        ).textContent =
            new Date()
            .toLocaleString("de-DE");

    } catch (error) {

        console.error(error);

        errorBox.classList.remove(
            "hidden"
        );

    } finally {

        hideLoader();
    }
}

refreshBtn.addEventListener(
    "click",
    loadAllData
);

loadAllData();

/*
Automatische Aktualisierung
jede Stunde
*/

setInterval(
    loadAllData,
    60 * 60 * 1000
);