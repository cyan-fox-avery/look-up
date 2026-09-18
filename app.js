import * as Astronomy from "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/+esm";
import * as satellite from "https://cdn.jsdelivr.net/npm/satellite.js@7.0.1/+esm";

const STORAGE_LOCATION = "lookUpLocationV1";
const STORAGE_TIME = "lookUpTimeFormatV1";
const CONSTELLATION_NAMES_URL = "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/constellations.json";
const CONSTELLATION_LINES_URL = "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/constellations.lines.json";
const PLANETS = [Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Saturn];
const state = {
location: null,
timeFormat: localStorage.getItem(STORAGE_TIME) || "12h",
weather: null,
light: null,
humanCount: null,
issCrew: null,
issPass: null,
constellationData: null,
lastAstronomy: null
};

const el = id => document.getElementById(id);

function init() {
setTimeToggle();
bindEvents();
const saved = loadSavedLocation();
if (saved) {
state.location = saved;
renderLocationLabel();
refreshDashboard();
} else {
openLocationModal();
}
setInterval(() => {
if (state.location) refreshAstronomyOnly();
}, 60000);
setInterval(() => {
if (state.location) refreshDashboard();
}, 10 * 60 * 1000);
}

function bindEvents() {
el("locationButton").addEventListener("click", openLocationModal);
el("closeLocationModal").addEventListener("click", closeLocationModal);
el("useLocationButton").addEventListener("click", useDeviceLocation);
el("citySearchForm").addEventListener("submit", event => {
event.preventDefault();
searchCity();
});
el("time12Button").addEventListener("click", () => setTimeFormat("12h"));
el("time24Button").addEventListener("click", () => setTimeFormat("24h"));
el("locationModal").addEventListener("click", event => {
if (event.target === el("locationModal") && state.location) closeLocationModal();
});
}

function loadSavedLocation() {
try {
const raw = localStorage.getItem(STORAGE_LOCATION);
if (!raw) return null;
const parsed = JSON.parse(raw);
if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lon)) return null;
return parsed;
} catch {
return null;
}
}

function saveLocation(location) {
localStorage.setItem(STORAGE_LOCATION, JSON.stringify(location));
}

function openLocationModal() {
el("locationModal").classList.remove("hidden");
el("locationStatus").textContent = "";
el("cityResults").innerHTML = "";
}

function closeLocationModal() {
if (!state.location) return;
el("locationModal").classList.add("hidden");
}

function setTimeFormat(format) {
state.timeFormat = format;
localStorage.setItem(STORAGE_TIME, format);
setTimeToggle();
if (state.location) renderAllFromState();
}

function setTimeToggle() {
el("time12Button").classList.toggle("active", state.timeFormat === "12h");
el("time24Button").classList.toggle("active", state.timeFormat === "24h");
}

async function useDeviceLocation() {
if (!navigator.geolocation) {
el("locationStatus").textContent = "This browser does not support location access. Please choose a city instead.";
return;
}
el("locationStatus").textContent = "Waiting for location permissionâ¦";
el("useLocationButton").disabled = true;
navigator.geolocation.getCurrentPosition(async position => {
const lat = position.coords.latitude;
const lon = position.coords.longitude;
let location = {
lat,
lon,
name: "Current location",
region: "",
country: "",
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
source: "device"
};
try {
const place = await reverseGeocode(lat, lon);
if (place) location = {...location, ...place};
} catch {
}
chooseLocation(location);
el("useLocationButton").disabled = false;
}, error => {
el("useLocationButton").disabled = false;
if (error.code === error.PERMISSION_DENIED) el("locationStatus").textContent = "Location permission was denied. No problem â choose a city below.";
else el("locationStatus").textContent = "I couldn't get your location. Try again or choose a city below.";
}, {
enableHighAccuracy: false,
timeout: 12000,
maximumAge: 10 * 60 * 1000
});
}

async function reverseGeocode(lat, lon) {
const url = new URL("https://nominatim.openstreetmap.org/reverse");
url.searchParams.set("format", "jsonv2");
url.searchParams.set("lat", lat.toFixed(5));
url.searchParams.set("lon", lon.toFixed(5));
url.searchParams.set("zoom", "10");
url.searchParams.set("addressdetails", "1");
url.searchParams.set("accept-language", "en");
const response = await fetch(url.toString(), {headers: {"Accept": "application/json"}});
if (!response.ok) throw new Error("Reverse geocoding failed");
const data = await response.json();
const a = data.address || {};
const name = a.city || a.town || a.village || a.municipality || a.county || "Current location";
const region = a.state || a.province || a.region || "";
const country = a.country || "";
return {name, region, country};
}

async function searchCity() {
const query = el("cityInput").value.trim();
if (!query) return;
el("locationStatus").textContent = "Searchingâ¦";
el("cityResults").innerHTML = "";
try {
const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
url.searchParams.set("name", query);
url.searchParams.set("count", "8");
url.searchParams.set("language", "en");
url.searchParams.set("format", "json");
const response = await fetch(url.toString());
if (!response.ok) throw new Error("Search failed");
const data = await response.json();
const results = data.results || [];
if (!results.length) {
el("locationStatus").textContent = "No matching cities found. Try a nearby city or a different spelling.";
return;
}
el("locationStatus").textContent = "Choose a match:";
for (const result of results) {
const button = document.createElement("button");
button.className = "city-result";
button.type = "button";
const regionBits = [result.admin1, result.country].filter(Boolean);
button.innerHTML = `<strong>${escapeHtml(result.name)}</strong><small>${escapeHtml(regionBits.join(", "))}</small>`;
button.addEventListener("click", () => {
chooseLocation({
lat: result.latitude,
lon: result.longitude,
name: result.name,
region: result.admin1 || "",
country: result.country || "",
timezone: result.timezone || "UTC",
source: "city"
});
});
el("cityResults").appendChild(button);
}
} catch {
el("locationStatus").textContent = "City search is temporarily unavailable. Please try again in a moment.";
}
}

function chooseLocation(location) {
state.location = location;
saveLocation(location);
renderLocationLabel();
closeLocationModal();
refreshDashboard();
}

function renderLocationLabel() {
if (!state.location) return;
const parts = [state.location.name, state.location.region].filter(Boolean);
el("locationLabel").textContent = parts.join(", ") || "Current location";
}

async function refreshDashboard() {
if (!state.location) return;
setLoadingState();
const tasks = await Promise.allSettled([
fetchWeather(),
fetchLightPollution(),
fetchHumansInSpace(),
fetchIssCrew(),
loadConstellationData(),
findNextVisibleIssPass()
]);
const weatherResult = tasks[0];
const lightResult = tasks[1];
const humansResult = tasks[2];
const crewResult = tasks[3];
const constellationsResult = tasks[4];
const issResult = tasks[5];
if (weatherResult.status === "fulfilled") state.weather = weatherResult.value;
if (lightResult.status === "fulfilled") state.light = lightResult.value;
if (humansResult.status === "fulfilled") state.humanCount = humansResult.value;
if (crewResult.status === "fulfilled") state.issCrew = crewResult.value;
if (constellationsResult.status === "fulfilled") state.constellationData = constellationsResult.value;
if (issResult.status === "fulfilled") state.issPass = issResult.value;
renderAllFromState();
}

function refreshAstronomyOnly() {
if (!state.location) return;
renderAllFromState();
}

function setLoadingState() {
el("heroSummary").textContent = "Reading the skyâ¦";
el("heroChips").innerHTML = "";
el("gaugeSummary").textContent = "Combining sky brightness, weather and moonlightâ¦";
el("constellationList").innerHTML = '<p class="muted">Finding well-placed constellationsâ¦</p>';
el("planetList").innerHTML = '<p class="muted">Checking the naked-eye planetsâ¦</p>';
el("issContent").innerHTML = '<p class="muted">Calculating the next visible passâ¦</p>';
}

async function fetchWeather() {
const {lat, lon} = state.location;
const url = new URL("https://api.open-meteo.com/v1/forecast");
url.searchParams.set("latitude", lat.toFixed(5));
url.searchParams.set("longitude", lon.toFixed(5));
url.searchParams.set("current", "temperature_2m,weather_code,cloud_cover,precipitation,relative_humidity_2m");
url.searchParams.set("hourly", "temperature_2m,weather_code,cloud_cover,precipitation_probability,precipitation,relative_humidity_2m,visibility");
url.searchParams.set("daily", "sunrise,sunset");
url.searchParams.set("forecast_days", "3");
url.searchParams.set("timezone", "auto");
url.searchParams.set("timeformat", "unixtime");
const response = await fetch(url.toString());
if (!response.ok) throw new Error("Weather failed");
const data = await response.json();
if (data.timezone) {
state.location.timezone = data.timezone;
saveLocation(state.location);
}
return data;
}

async function fetchLightPollution() {
const {lat, lon} = state.location;
const url = `https://nordapi.ee/api/v1/lightpollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
const response = await fetch(url);
if (!response.ok) throw new Error("Light pollution failed");
const data = await response.json();
return data.light_pollution || data.data || data;
}

async function fetchHumansInSpace() {
const url = "https://ll.thespacedevs.com/2.3.0/astronauts/?in_space=true&is_human=true&limit=1&format=json";
const response = await fetch(url);
if (!response.ok) throw new Error("Human count failed");
const data = await response.json();
return Number.isFinite(data.count) ? data.count : null;
}

async function fetchIssCrew() {
const url = "https://ll.thespacedevs.com/2.3.0/expeditions/?is_active=true&space_station=4&mode=detailed&limit=5&format=json";
const response = await fetch(url);
if (!response.ok) throw new Error("ISS crew failed");
const data = await response.json();
const active = (data.results || []).find(item => item.spacestation?.id === 4 || /international space station/i.test(item.spacestation?.name || "")) || data.results?.[0];
if (!active) return null;
if (Array.isArray(active.crew)) return active.crew.length;
if (Array.isArray(active.crew_members)) return active.crew_members.length;
return null;
}

async function loadConstellationData() {
if (state.constellationData) return state.constellationData;
const [namesResponse, linesResponse] = await Promise.all([fetch(CONSTELLATION_NAMES_URL), fetch(CONSTELLATION_LINES_URL)]);
if (!namesResponse.ok || !linesResponse.ok) throw new Error("Constellation data failed");
const [names, lines] = await Promise.all([namesResponse.json(), linesResponse.json()]);
const metadata = new Map();
for (const feature of names.features || []) {
const id = feature.id;
const coords = feature.geometry?.coordinates || [0, 0];
const existing = metadata.get(id);
if (!existing) {
metadata.set(id, {
id,
name: id === "Ser" ? "Serpens" : feature.properties?.name || id,
rank: Number(feature.properties?.rank || 3),
center: coords
});
}
}
const shapes = new Map();
for (const feature of lines.features || []) {
const id = feature.id;
if (!shapes.has(id)) shapes.set(id, []);
for (const segment of feature.geometry?.coordinates || []) {
for (const point of segment) shapes.get(id).push(point);
}
}
return {metadata, shapes};
}

function renderAllFromState() {
if (!state.location) return;
const astronomy = calculateAstronomy();
state.lastAstronomy = astronomy;
renderHero(astronomy);
renderConditions(astronomy);
renderMoon(astronomy);
renderSun(astronomy);
renderConstellations(astronomy);
renderPlanets(astronomy);
renderIss();
renderHumans();
renderLightPollution();
}

function calculateAstronomy() {
const now = new Date();
const observer = new Astronomy.Observer(state.location.lat, state.location.lon, 0);
const sun = horizontalForBody(Astronomy.Body.Sun, now, observer);
const moon = horizontalForBody(Astronomy.Body.Moon, now, observer);
const moonPhaseAngle = Astronomy.MoonPhase(now);
const moonIllumination = Astronomy.Illumination(Astronomy.Body.Moon, now).phase_fraction;
const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, now, 2);
const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, now, 2);
const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, now, 2);
const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, now, 2);
const civilDusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, now, 2, -6);
const astroDusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, now, 2, -18);
const astroDawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, now, 2, -18);
const moonQuarters = findMoonQuarters(now);
const skyState = describeSunAltitude(sun.altitude);
const tonight = getTonightWindow(observer, now, sun.altitude);
const evaluationTime = getSkyEvaluationTime(observer, now, sun.altitude, tonight);
return {
now,
observer,
sun,
moon,
moonPhaseAngle,
moonIllumination,
moonrise,
moonset,
sunrise,
sunset,
civilDusk,
astroDusk,
astroDawn,
moonQuarters,
skyState,
tonight,
evaluationTime,
isDaylight: sun.altitude >= -0.833
};
}

function horizontalForBody(body, date, observer) {
const equ = Astronomy.Equator(body, date, observer, true, true);
return Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
}

function findMoonQuarters(now) {
let q = Astronomy.SearchMoonQuarter(now);
let nextNew = null;
let nextFull = null;
for (let i = 0; i < 10 && (!nextNew || !nextFull); i++) {
if (q.quarter === 0 && !nextNew) nextNew = q.time;
if (q.quarter === 2 && !nextFull) nextFull = q.time;
q = Astronomy.NextMoonQuarter(q);
}
return {nextNew, nextFull};
}

function getTonightWindow(observer, now, sunAltitude) {
let dusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, now, 2, -18);
let dawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, now, 2, -18);
if (sunAltitude <= -18) {
const lookback = new Date(now.getTime() - 20 * 60 * 60 * 1000);
const previousDusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, lookback, 2, -18);
if (previousDusk && previousDusk.date <= now) dusk = previousDusk;
if (!dawn || dawn.date <= now) dawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, new Date(now.getTime() + 1000), 2, -18);
} else if (dusk) {
dawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, new Date(dusk.date.getTime() + 60000), 2, -18);
}
return {
dusk: dusk?.date || null,
dawn: dawn?.date || null
};
}

function getSkyEvaluationTime(observer, now, sunAltitude, tonight) {
if (sunAltitude < -6) return now;
if (tonight.dusk && tonight.dawn && tonight.dawn > tonight.dusk) {
return new Date(tonight.dusk.getTime() + (tonight.dawn.getTime() - tonight.dusk.getTime()) / 2);
}
const fallback = new Date(now);
fallback.setTime(fallback.getTime() + 10 * 60 * 60 * 1000);
return fallback;
}

function renderHero(a) {
const weatherText = state.weather ? weatherCodeText(state.weather.current?.weather_code) : "weather unavailable";
const tempText = state.weather ? formatBothTemps(state.weather.current?.temperature_2m) : "";
const moonName = moonPhaseName(a.moonPhaseAngle);
const planetInfos = getPlanetInfos(a);
const visiblePlanets = planetInfos.filter(p => p.visible);
const timeContext = a.isDaylight ? "Daylight" : a.skyState;
const summaryParts = [timeContext, weatherText];
if (tempText) summaryParts.push(tempText);
summaryParts.push(`${moonName} Moon`);
el("heroSummary").textContent = summaryParts.join(" Â· ");
const chips = [];
chips.push(`ð ${Math.round(a.moonIllumination * 100)}% Moon`);
if (visiblePlanets.length) chips.push(`ðª ${visiblePlanets.length} naked-eye planet${visiblePlanets.length === 1 ? "" : "s"} ${a.isDaylight ? "tonight" : "visible"}`);
if (state.light?.bortle_class) chips.push(`ð Bortle ${state.light.bortle_class}/9`);
if (state.issPass) chips.push(`ð°ï¸ ISS ${formatTime(state.issPass.start)}`);
if (Number.isFinite(state.humanCount)) chips.push(`ð©âð ${state.humanCount} humans in space`);
el("heroChips").innerHTML = chips.map(text => `<span class="chip">${escapeHtml(text)}</span>`).join("");
}

function renderConditions(a) {
const currentWeather = getCurrentWeatherPoint();
const bortle = Number(state.light?.bortle_class);
if (a.isDaylight) {
setGauge("Daylight", null);
const tonightSummary = summarizeTonight(a);
el("gaugeSummary").textContent = tonightSummary;
} else {
const rating = scoreObservingConditions({
cloud: currentWeather.cloud,
precipProbability: currentWeather.precipProbability,
precipitation: currentWeather.precipitation,
visibility: currentWeather.visibility,
humidity: currentWeather.humidity,
moonIllumination: a.moonIllumination,
moonAltitude: a.moon.altitude,
sunAltitude: a.sun.altitude,
bortle
});
setGauge(rating.label, rating.index);
el("gaugeSummary").textContent = rating.reasons.join(" Â· ");
}
el("cloudValue").textContent = Number.isFinite(currentWeather.cloud) ? `${Math.round(currentWeather.cloud)}%` : "â";
el("precipValue").textContent = Number.isFinite(currentWeather.precipProbability) ? `${Math.round(currentWeather.precipProbability)}%` : Number.isFinite(currentWeather.precipitation) ? `${currentWeather.precipitation.toFixed(1)} mm` : "â";
el("tempValue").textContent = Number.isFinite(currentWeather.temperature) ? formatBothTemps(currentWeather.temperature) : "â";
el("visibilityValue").textContent = Number.isFinite(currentWeather.visibility) ? formatVisibility(currentWeather.visibility) : "â";
el("bestWindow").textContent = calculateBestViewingWindow(a) || "A best viewing window will appear when a usable forecast is available.";
}

function setGauge(label, index) {
el("gaugeLabel").textContent = label;
const needle = el("gaugeNeedle");
if (index === null || index === undefined) {
needle.style.opacity = "0.28";
needle.setAttribute("transform", "rotate(0 110 110)");
return;
}
const angles = [-72, -36, 0, 36, 72];
needle.style.opacity = "1";
needle.setAttribute("transform", `rotate(${angles[index]} 110 110)`);
}

function summarizeTonight(a) {
const bortle = Number(state.light?.bortle_class);
const best = getBestForecastPoint(a);
const pieces = [];
if (best) {
if (best.cloud <= 20) pieces.push("Clear skies expected tonight");
else if (best.cloud <= 50) pieces.push("Some cloud tonight");
else pieces.push("Clouds may interfere tonight");
}
if (Number.isFinite(bortle)) pieces.push(`Bortle ${bortle}/9 Â· ${bortleWords(bortle)}`);
pieces.push(`${Math.round(a.moonIllumination * 100)}% illuminated Moon`);
return pieces.join(" Â· ");
}

function scoreObservingConditions(input) {
let score = 100;
const reasons = [];
const cloud = finiteOr(input.cloud, 50);
const pop = finiteOr(input.precipProbability, 0);
const precipitation = finiteOr(input.precipitation, 0);
const visibility = finiteOr(input.visibility, 20000);
const humidity = finiteOr(input.humidity, 60);
const bortle = Number.isFinite(input.bortle) ? input.bortle : null;
if (cloud > 85) score -= 72;
else if (cloud > 65) score -= 52;
else if (cloud > 40) score -= 31;
else if (cloud > 20) score -= 14;
if (pop > 70 || precipitation > 1) score -= 25;
else if (pop > 40 || precipitation > 0.2) score -= 13;
if (visibility < 5000) score -= 23;
else if (visibility < 10000) score -= 12;
if (humidity > 92) score -= 7;
if (input.moonAltitude > 0) score -= Math.max(0, input.moonIllumination - 0.35) * 20;
if (Number.isFinite(bortle)) score -= Math.max(0, bortle - 1) * 3.5;
if (input.sunAltitude > -6) score -= 35;
else if (input.sunAltitude > -12) score -= 20;
else if (input.sunAltitude > -18) score -= 10;
score = Math.max(0, Math.min(100, score));
let index = score >= 83 ? 4 : score >= 65 ? 3 : score >= 45 ? 2 : score >= 25 ? 1 : 0;
if (Number.isFinite(bortle) && bortle >= 8) index = Math.min(index, 2);
else if (Number.isFinite(bortle) && bortle >= 6) index = Math.min(index, 3);
if (cloud >= 92) index = 0;
const labels = ["Poor", "Limited", "Fair", "Good", "Excellent"];
if (cloud <= 20) reasons.push("Clear sky");
else if (cloud <= 50) reasons.push("Some cloud cover");
else if (cloud <= 80) reasons.push("Cloudy");
else reasons.push("Heavy cloud cover");
if (input.moonAltitude <= 0) reasons.push("Moon below the horizon");
else if (input.moonIllumination < 0.25) reasons.push("Low moonlight");
else if (input.moonIllumination > 0.75) reasons.push("Bright moonlight");
else reasons.push("Moderate moonlight");
if (Number.isFinite(bortle)) reasons.push(`Bortle ${bortle}/9 Â· ${bortleWords(bortle)}`);
if (input.sunAltitude > -18 && input.sunAltitude <= -0.833) reasons.push("Twilight is still fading");
return {score, index, label: labels[index], reasons};
}

function getCurrentWeatherPoint() {
const weather = state.weather;
if (!weather) return {};
const currentTime = weather.current?.time;
const nearest = nearestHourlyIndex(currentTime);
return {
temperature: weather.current?.temperature_2m ?? weather.hourly?.temperature_2m?.[nearest],
cloud: weather.current?.cloud_cover ?? weather.hourly?.cloud_cover?.[nearest],
precipitation: weather.current?.precipitation ?? weather.hourly?.precipitation?.[nearest],
precipProbability: weather.hourly?.precipitation_probability?.[nearest],
humidity: weather.current?.relative_humidity_2m ?? weather.hourly?.relative_humidity_2m?.[nearest],
visibility: weather.hourly?.visibility?.[nearest]
};
}

function nearestHourlyIndex(unixSeconds) {
const times = state.weather?.hourly?.time || [];
if (!times.length) return 0;
const target = Number.isFinite(unixSeconds) ? unixSeconds : Math.floor(Date.now() / 1000);
let best = 0;
let bestDelta = Infinity;
for (let i = 0; i < times.length; i++) {
const delta = Math.abs(times[i] - target);
if (delta < bestDelta) {
best = i;
bestDelta = delta;
}
}
return best;
}

function getBestForecastPoint(a) {
const candidates = getNightForecastScores(a);
if (!candidates.length) return null;
return candidates.reduce((best, item) => item.rating.score > best.rating.score ? item : best).weather;
}

function getNightForecastScores(a) {
const hourly = state.weather?.hourly;
if (!hourly?.time?.length) return [];
const bortle = Number(state.light?.bortle_class);
let start = a.tonight.dusk?.getTime() ?? Date.now();
let end = a.tonight.dawn?.getTime() ?? start + 12 * 60 * 60 * 1000;
if (end <= start) end = start + 12 * 60 * 60 * 1000;
const out = [];
for (let i = 0; i < hourly.time.length; i++) {
const time = new Date(hourly.time[i] * 1000);
if (time.getTime() < start - 60 * 60 * 1000 || time.getTime() > end + 60 * 60 * 1000) continue;
const moon = horizontalForBody(Astronomy.Body.Moon, time, a.observer);
const sun = horizontalForBody(Astronomy.Body.Sun, time, a.observer);
const illum = Astronomy.Illumination(Astronomy.Body.Moon, time).phase_fraction;
const weather = {
time,
temperature: hourly.temperature_2m?.[i],
cloud: hourly.cloud_cover?.[i],
precipProbability: hourly.precipitation_probability?.[i],
precipitation: hourly.precipitation?.[i],
humidity: hourly.relative_humidity_2m?.[i],
visibility: hourly.visibility?.[i]
};
const rating = scoreObservingConditions({
...weather,
moonIllumination: illum,
moonAltitude: moon.altitude,
sunAltitude: sun.altitude,
bortle
});
out.push({weather, rating});
}
return out;
}

function calculateBestViewingWindow(a) {
const scores = getNightForecastScores(a);
if (!scores.length) return null;
let bestIndex = 0;
for (let i = 1; i < scores.length; i++) {
if (scores[i].rating.score > scores[bestIndex].rating.score) bestIndex = i;
}
const peak = scores[bestIndex].rating.score;
let start = bestIndex;
let end = bestIndex;
while (start > 0 && scores[start - 1].rating.score >= peak - 6) start--;
while (end < scores.length - 1 && scores[end + 1].rating.score >= peak - 6) end++;
const startTime = scores[start].weather.time;
const endTime = new Date(scores[end].weather.time.getTime() + 60 * 60 * 1000);
return `Best viewing: ${formatTime(startTime)}â${formatTime(endTime)} Â· ${scores[bestIndex].rating.label}`;
}

function renderMoon(a) {
const percent = Math.round(a.moonIllumination * 100);
el("moonPercent").textContent = `${percent}% illuminated`;
el("moonPhase").textContent = moonPhaseName(a.moonPhaseAngle);
el("moonPosition").textContent = a.moon.altitude > 0 ? `${altitudeWords(a.moon.altitude)} in the ${compassDirection(a.moon.azimuth)} Â· ${Math.round(a.moon.altitude)}Â°` : `Below the horizon Â· ${Math.round(Math.abs(a.moon.altitude))}Â° below`;
el("moonriseValue").textContent = formatAstroTime(a.moonrise);
el("moonsetValue").textContent = formatAstroTime(a.moonset);
el("fullMoonValue").textContent = formatAstroDate(a.moonQuarters.nextFull);
el("newMoonValue").textContent = formatAstroDate(a.moonQuarters.nextNew);
drawMoon(a.moonPhaseAngle);
}

function drawMoon(phaseDegrees) {
const canvas = el("moonCanvas");
const ctx = canvas.getContext("2d");
const w = canvas.width;
const h = canvas.height;
const cx = w / 2;
const cy = h / 2;
const r = Math.min(w, h) * 0.41;
const image = ctx.createImageData(w, h);
const data = image.data;
const phase = phaseDegrees * Math.PI / 180;
const sx = Math.sin(phase);
const sz = -Math.cos(phase);
for (let y = 0; y < h; y++) {
for (let x = 0; x < w; x++) {
const dx = (x - cx) / r;
const dy = (y - cy) / r;
const rr = dx * dx + dy * dy;
const idx = (y * w + x) * 4;
if (rr > 1) {
data[idx + 3] = 0;
continue;
}
const nz = Math.sqrt(Math.max(0, 1 - rr));
const lightDot = dx * sx + nz * sz;
const limb = Math.max(0.18, nz);
let brightness;
if (lightDot > 0) brightness = 178 + 58 * Math.min(1, lightDot * 1.8) + 15 * limb;
else brightness = 20 + 18 * limb;
const craterNoise = 1 - 0.055 * (Math.sin(x * 0.19) * Math.sin(y * 0.13) + Math.sin((x + y) * 0.071));
brightness *= craterNoise;
data[idx] = Math.min(255, brightness * 1.01);
data[idx + 1] = Math.min(255, brightness * 1.02);
data[idx + 2] = Math.min(255, brightness * 1.05);
data[idx + 3] = 255;
}
}
ctx.clearRect(0, 0, w, h);
ctx.putImageData(image, 0, 0);
ctx.save();
ctx.beginPath();
ctx.arc(cx, cy, r, 0, Math.PI * 2);
ctx.clip();
ctx.globalAlpha = 0.11;
ctx.fillStyle = "#102036";
const craters = [[-0.28,-0.18,0.13],[0.22,-0.26,0.09],[0.11,0.22,0.16],[-0.36,0.31,0.08],[0.38,0.1,0.07],[-0.02,-0.43,0.06]];
for (const [px, py, pr] of craters) {
ctx.beginPath();
ctx.arc(cx + px * r, cy + py * r, pr * r, 0, Math.PI * 2);
ctx.fill();
}
ctx.restore();
ctx.beginPath();
ctx.arc(cx, cy, r, 0, Math.PI * 2);
ctx.strokeStyle = "rgba(225,240,255,0.22)";
ctx.lineWidth = 1.5;
ctx.stroke();
}

function renderSun(a) {
el("skyState").textContent = a.skyState;
el("sunriseValue").textContent = formatAstroTime(a.sunrise);
el("sunsetValue").textContent = formatAstroTime(a.sunset);
el("dayLengthValue").textContent = calculateDayLength();
el("civilDuskValue").textContent = formatAstroTime(a.civilDusk);
el("astroDuskValue").textContent = formatAstroTime(a.astroDusk);
el("astroDawnValue").textContent = formatAstroTime(a.astroDawn);
}

function calculateDayLength() {
const daily = state.weather?.daily;
if (!daily?.sunrise?.length || !daily?.sunset?.length) return "â";
const now = Date.now() / 1000;
let index = 0;
for (let i = 0; i < daily.sunrise.length; i++) {
if (daily.sunset[i] >= now - 12 * 3600) {
index = i;
break;
}
}
const seconds = daily.sunset[index] - daily.sunrise[index];
if (!Number.isFinite(seconds) || seconds <= 0) return "â";
const hours = Math.floor(seconds / 3600);
const minutes = Math.round((seconds % 3600) / 60);
return `${hours}h ${minutes}m`;
}

function renderConstellations(a) {
const daylight = a.isDaylight;
el("constellationsTitle").textContent = daylight ? "Visible tonight" : "Visible now";
el("constellationTime").textContent = daylight ? `Around ${formatTime(a.evaluationTime)}` : "NOW";
if (!state.constellationData) {
el("constellationList").innerHTML = '<p class="muted error-note">Constellation data is temporarily unavailable.</p>';
return;
}
const items = getVisibleConstellations(a.evaluationTime, a.observer);
if (!items.length) {
el("constellationList").innerHTML = '<p class="muted">No constellations meet the âwell placedâ threshold for this time.</p>';
return;
}
el("constellationList").innerHTML = items.map(item => `<div class="object-row"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(altitudeWords(item.altitude))} in the ${escapeHtml(compassDirection(item.azimuth))}</small></div><div class="object-altitude">${Math.round(item.altitude)}Â°</div></div>`).join("");
}

function getVisibleConstellations(date, observer) {
const {metadata, shapes} = state.constellationData;
const results = [];
for (const [id, meta] of metadata.entries()) {
const centerRa = geoLongitudeToRa(meta.center[0]);
const centerHor = Astronomy.Horizon(date, observer, centerRa, meta.center[1], "normal");
const points = shapes.get(id) || [];
if (!points.length) continue;
let above = 0;
let maxAltitude = -90;
for (const point of points) {
const ra = geoLongitudeToRa(point[0]);
const hor = Astronomy.Horizon(date, observer, ra, point[1], "normal");
if (hor.altitude >= 10) above++;
if (hor.altitude > maxAltitude) maxAltitude = hor.altitude;
}
const fraction = above / points.length;
if (centerHor.altitude < 10 || maxAltitude < 25 || fraction < 0.45) continue;
const rankBonus = meta.rank === 1 ? 25 : meta.rank === 2 ? 12 : 0;
const score = centerHor.altitude + maxAltitude * 0.35 + fraction * 40 + rankBonus;
results.push({
name: meta.name,
altitude: centerHor.altitude,
azimuth: centerHor.azimuth,
score
});
}
return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

function geoLongitudeToRa(longitude) {
return ((longitude % 360) + 360) % 360 / 15;
}

function renderPlanets(a) {
const daylight = a.isDaylight;
el("planetsTitle").textContent = daylight ? "Visible tonight" : "Visible now";
const infos = getPlanetInfos(a).filter(item => item.visible);
if (!infos.length) {
el("planetList").innerHTML = `<p class="muted">No naked-eye planets are well placed ${daylight ? "tonight" : "right now"}.</p>`;
return;
}
el("planetList").innerHTML = infos.map(item => `<div class="object-row"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(altitudeWords(item.altitude))} in the ${escapeHtml(compassDirection(item.azimuth))}${item.bestTime ? ` Â· best around ${escapeHtml(formatTime(item.bestTime))}` : ""}</small></div><div class="object-altitude">${Math.round(item.altitude)}Â° Â· mag ${item.magnitude.toFixed(1)}</div></div>`).join("");
}

function getPlanetInfos(a) {
if (!a.isDaylight) {
return PLANETS.map(body => planetAtTime(body, a.now, a.observer)).map(info => ({...info, visible: planetVisible(info, a.now, a.observer), bestTime: null}));
}
return PLANETS.map(body => bestPlanetTonight(body, a.now, a.observer));
}

function planetAtTime(body, date, observer) {
const hor = horizontalForBody(body, date, observer);
const illum = Astronomy.Illumination(body, date);
const angleFromSun = Astronomy.AngleFromSun(body, date);
return {
body,
name: body,
altitude: hor.altitude,
azimuth: hor.azimuth,
magnitude: illum.mag,
angleFromSun
};
}

function planetVisible(info, date, observer) {
const sunAlt = horizontalForBody(Astronomy.Body.Sun, date, observer).altitude;
const minSunDarkness = info.body === Astronomy.Body.Mercury || info.body === Astronomy.Body.Venus ? -4 : -6;
return info.altitude >= 10 && info.angleFromSun >= 12 && info.magnitude <= 6 && sunAlt <= minSunDarkness;
}

function bestPlanetTonight(body, now, observer) {
let best = null;
for (let minutes = 0; minutes <= 20 * 60; minutes += 15) {
const date = new Date(now.getTime() + minutes * 60000);
const info = planetAtTime(body, date, observer);
if (!planetVisible(info, date, observer)) continue;
const score = info.altitude - Math.max(0, info.magnitude) * 2;
if (!best || score > best.score) best = {...info, score, bestTime: date, visible: true};
}
if (best) return best;
const fallback = planetAtTime(body, aSafeFuture(now), observer);
return {...fallback, visible: false, bestTime: null};
}

function aSafeFuture(now) {
return new Date(now.getTime() + 10 * 60 * 60 * 1000);
}

async function findNextVisibleIssPass() {
try {
const tle = await fetchIssTle();
if (!tle) return null;
const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
const observerGd = {
longitude: satellite.degreesToRadians(state.location.lon),
latitude: satellite.degreesToRadians(state.location.lat),
height: 0
};
const start = Date.now();
const end = start + 7 * 24 * 60 * 60 * 1000;
let inPass = false;
let passStart = null;
for (let t = start; t <= end; t += 60000) {
const look = getIssLook(satrec, new Date(t), observerGd);
if (!look) continue;
if (look.elevation > 0 && !inPass) {
inPass = true;
passStart = t - 60000;
}
if (look.elevation <= 0 && inPass) {
const pass = refineIssPass(satrec, observerGd, Math.max(start, passStart), t + 60000);
inPass = false;
if (pass) return pass;
}
}
return null;
} catch {
return null;
}
}

async function fetchIssTle() {
try {
const response = await fetch("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE");
if (response.ok) {
const text = await response.text();
const lines = text.trim().split(/\r?\n/).map(line => line.trim());
const line1 = lines.find(line => line.startsWith("1 "));
const line2 = lines.find(line => line.startsWith("2 "));
if (line1 && line2) return {line1, line2};
}
} catch {
}
try {
const response = await fetch("https://nordapi.ee/api/v1/iss/tle");
if (response.ok) {
const data = await response.json();
const source = data.tle || data.data || data;
if (source.line1 && source.line2) return {line1: source.line1, line2: source.line2};
}
} catch {
}
try {
const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544/tles");
if (response.ok) {
const data = await response.json();
if (data.line1 && data.line2) return {line1: data.line1, line2: data.line2};
}
} catch {
}
return null;
}

function getIssLook(satrec, date, observerGd) {
const propagated = satellite.propagate(satrec, date);
if (!propagated?.position || propagated.position === false) return null;
const gmst = satellite.gstime(date);
const positionEcf = satellite.eciToEcf(propagated.position, gmst);
const look = satellite.ecfToLookAngles(observerGd, positionEcf);
return {
elevation: satellite.radiansToDegrees(look.elevation),
azimuth: satellite.radiansToDegrees(look.azimuth),
range: look.rangeSat,
positionEci: propagated.position
};
}

function refineIssPass(satrec, observerGd, startMs, endMs) {
let max = null;
const visible = [];
for (let t = startMs; t <= endMs; t += 10000) {
const date = new Date(t);
const look = getIssLook(satrec, date, observerGd);
if (!look) continue;
if (!max || look.elevation > max.look.elevation) max = {date, look};
if (look.elevation < 5) continue;
const sunAlt = sunAltitudeAt(date);
if (sunAlt > -6) continue;
let shadow = 1;
try {
const sun = satellite.sunPos(satellite.jday(date));
shadow = satellite.shadowFraction(sun.rsun, look.positionEci);
} catch {
shadow = 0;
}
if (shadow < 0.65) visible.push({date, look, shadow});
}
if (!visible.length || !max || max.look.elevation < 10) return null;
const first = visible[0];
const last = visible[visible.length - 1];
let closest = visible[0];
let highestVisible = visible[0];
for (const sample of visible) {
if (sample.look.range < closest.look.range) closest = sample;
if (sample.look.elevation > highestVisible.look.elevation) highestVisible = sample;
}
return {
start: first.date,
end: last.date,
startDirection: compassDirection(first.look.azimuth),
endDirection: compassDirection(last.look.azimuth),
maxElevation: max.look.elevation,
visibleMaxElevation: highestVisible.look.elevation,
closestDistanceKm: closest.look.range,
peakTime: highestVisible.date
};
}

function sunAltitudeAt(date) {
const observer = new Astronomy.Observer(state.location.lat, state.location.lon, 0);
return horizontalForBody(Astronomy.Body.Sun, date, observer).altitude;
}

function renderIss() {
if (!state.issPass) {
el("issContent").innerHTML = '<p class="muted">No visible ISS pass was found in the next seven days, or pass data is temporarily unavailable.</p>';
return;
}
const pass = state.issPass;
const cloud = weatherAt(pass.peakTime)?.cloud;
const cloudNote = Number.isFinite(cloud) && cloud >= 70 ? `<p class="muted">âï¸ A visible pass is predicted, but cloud cover may interfere.</p>` : "";
const crew = Number.isFinite(state.issCrew) ? `<div class="metric"><span>Crew aboard</span><strong>${state.issCrew}</strong></div>` : "";
el("issContent").innerHTML = `<p class="iss-main-time">${escapeHtml(formatTime(pass.start))}</p><p class="muted">Next visible pass</p><p class="route-line">${escapeHtml(pass.startDirection)} â ${escapeHtml(pass.endDirection)}</p><div class="metric-grid three"><div class="metric"><span>Maximum altitude</span><strong>${escapeHtml(altitudeWords(pass.maxElevation))} Â· ${Math.round(pass.maxElevation)}Â°</strong></div><div class="metric"><span>Closest distance</span><strong>~${Math.round(pass.closestDistanceKm)} km</strong></div>${crew}</div>${cloudNote}`;
}

function weatherAt(date) {
const hourly = state.weather?.hourly;
if (!hourly?.time?.length) return null;
const unix = date.getTime() / 1000;
let best = 0;
let delta = Infinity;
for (let i = 0; i < hourly.time.length; i++) {
const d = Math.abs(hourly.time[i] - unix);
if (d < delta) {
delta = d;
best = i;
}
}
return {cloud: hourly.cloud_cover?.[best]};
}

function renderHumans() {
el("humanCount").textContent = Number.isFinite(state.humanCount) ? state.humanCount : "â";
el("humanCaption").textContent = Number.isFinite(state.humanCount) ? `${state.humanCount === 1 ? "human" : "humans"} currently in space` : "Current human spaceflight count unavailable";
el("issCrewValue").textContent = Number.isFinite(state.issCrew) ? `ISS crew: ${state.issCrew}` : "ISS crew: unavailable";
}

function renderLightPollution() {
const light = state.light;
if (!light || !Number.isFinite(Number(light.bortle_class))) {
el("bortleNumber").textContent = "â";
el("bortleDescription").textContent = "Light-pollution estimate is temporarily unavailable.";
el("sqmValue").textContent = "â";
el("starsValue").textContent = "â";
el("skyQualityValue").textContent = "â";
return;
}
const bortle = Number(light.bortle_class);
el("bortleNumber").textContent = `Bortle ${bortle}`;
el("bortleDescription").textContent = `Light pollution: ${bortle}/9 Â· ${bortleWords(bortle)}`;
el("sqmValue").textContent = Number.isFinite(Number(light.sqm_estimate)) ? Number(light.sqm_estimate).toFixed(2) : "â";
el("starsValue").textContent = light.naked_eye_stars || "â";
el("skyQualityValue").textContent = titleCase(light.sky_quality || "â");
el("lightDisclaimer").textContent = light.disclaimer || "Estimated from nearby population patterns, not measured directly from your exact observing spot.";
}

function describeSunAltitude(altitude) {
if (altitude >= -0.833) return "Daylight";
if (altitude >= -6) return "Civil twilight";
if (altitude >= -12) return "Nautical twilight";
if (altitude >= -18) return "Astronomical twilight";
return "Night";
}

function moonPhaseName(angle) {
const a = ((angle % 360) + 360) % 360;
if (a < 22.5 || a >= 337.5) return "New Moon";
if (a < 67.5) return "Waxing Crescent";
if (a < 112.5) return "First Quarter";
if (a < 157.5) return "Waxing Gibbous";
if (a < 202.5) return "Full Moon";
if (a < 247.5) return "Waning Gibbous";
if (a < 292.5) return "Last Quarter";
return "Waning Crescent";
}

function compassDirection(azimuth) {
const names = ["North", "North-northeast", "Northeast", "East-northeast", "East", "East-southeast", "Southeast", "South-southeast", "South", "South-southwest", "Southwest", "West-southwest", "West", "West-northwest", "Northwest", "North-northwest"];
const index = Math.round((((azimuth % 360) + 360) % 360) / 22.5) % 16;
return names[index];
}

function altitudeWords(altitude) {
if (altitude >= 75) return "Nearly overhead";
if (altitude >= 50) return "High";
if (altitude >= 25) return "Medium-high";
if (altitude >= 10) return "Low";
if (altitude >= 0) return "Very low";
return "Below the horizon";
}

function bortleWords(value) {
const map = {
1: "pristine dark sky",
2: "very dark sky",
3: "rural dark sky",
4: "rural-suburban transition",
5: "suburban sky",
6: "bright suburban sky",
7: "suburban-urban sky",
8: "city sky",
9: "inner-city sky"
};
return map[Math.round(value)] || "estimated sky brightness";
}

function weatherCodeText(code) {
const c = Number(code);
if (c === 0) return "Clear";
if (c === 1) return "Mostly clear";
if (c === 2) return "Partly cloudy";
if (c === 3) return "Overcast";
if (c === 45 || c === 48) return "Foggy";
if ([51,53,55,56,57].includes(c)) return "Drizzle";
if ([61,63,65,66,67].includes(c)) return "Rain";
if ([71,73,75,77].includes(c)) return "Snow";
if ([80,81,82].includes(c)) return "Rain showers";
if ([85,86].includes(c)) return "Snow showers";
if ([95,96,99].includes(c)) return "Thunderstorms";
return "Conditions available";
}

function formatBothTemps(celsius) {
if (!Number.isFinite(Number(celsius))) return "â";
const c = Math.round(Number(celsius));
const f = Math.round(c * 9 / 5 + 32);
return `${c}Â°C Â· ${f}Â°F`;
}

function formatVisibility(meters) {
if (!Number.isFinite(Number(meters))) return "â";
const km = Number(meters) / 1000;
return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

function formatAstroTime(value) {
if (!value) return "â";
const date = value.date || value;
return formatTime(date);
}

function formatAstroDate(value) {
if (!value) return "â";
const date = value.date || value;
return new Intl.DateTimeFormat("en-CA", {
timeZone: currentTimezone(),
month: "short",
day: "numeric"
}).format(date);
}

function formatTime(date) {
if (!date) return "â";
return new Intl.DateTimeFormat("en-CA", {
timeZone: currentTimezone(),
hour: "numeric",
minute: "2-digit",
hour12: state.timeFormat === "12h"
}).format(date);
}

function currentTimezone() {
return state.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function finiteOr(value, fallback) {
const n = Number(value);
return Number.isFinite(n) ? n : fallback;
}

function titleCase(value) {
return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(value) {
return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}

init();