import * as Astronomy from "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/+esm";
import * as satellite from "https://cdn.jsdelivr.net/npm/satellite.js@7.0.1/+esm";

const STORAGE_LOCATION = "lookUpLocationV1";
const STORAGE_TIME = "lookUpTimeFormatV1";
const STORAGE_LANGUAGE = "lookUpLanguageV1";
const CONSTELLATION_NAMES_URL = "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/constellations.json";
const CONSTELLATION_LINES_URL = "https://cdn.jsdelivr.net/gh/ofrohn/d3-celestial@master/data/constellations.lines.json";
const NASA_MOON_YEAR = 2026;
const NASA_MOON_NORTH_BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/730x730_1x1_30p/moon.";
const NASA_MOON_SOUTH_BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005588/frames/730x730_1x1_30p/moon.";
const HUMAN_DATA_REFRESH_MS = 45 * 60 * 1000;
const PLANETS = [Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Saturn];
const state = {
location: null,
timeFormat: localStorage.getItem(STORAGE_TIME) || "12h",
language: localStorage.getItem(STORAGE_LANGUAGE) || "en",
weather: null,
humanCount: null,
humanBreakdown: [],
humanDataFetchedAt: 0,
issCrew: null,
issPass: null,
constellationData: null,
lastAstronomy: null
};

const el = id => document.getElementById(id);


const I18N = {
en: {
personalSkyDashboard: "PERSONAL SKY DASHBOARD",
tagline: "Your sky, right now.",
changeLocation: "Change location",
chooseLocation: "Choose location",
timeFormat: "Time format",
language: "Language",
rightNow: "RIGHT NOW",
yourSkyRightNow: "Your sky right now",
live: "LIVE",
liveData: "Live data",
chooseLocationToBegin: "Choose a location to begin.",
stargazing: "STARGAZING",
observingConditions: "Observing conditions",
waitingForLocation: "Waiting for location",
conditionsIntro: "Weather, visibility and moonlight will be combined here.",
clouds: "Clouds",
precipitation: "Precipitation",
temperature: "Temperature",
visibility: "Visibility",
bestWindowPlaceholder: "Best viewing window will appear here.",
moon: "MOON",
nextMoonrise: "Next moonrise",
nextMoonset: "Next moonset",
nextFullMoon: "Next full Moon",
nextNewMoon: "Next new Moon",
sunDarkness: "SUN & DARKNESS",
todaysLight: "Today's light",
nextSunrise: "Next sunrise",
nextSunset: "Next sunset",
daylightLength: "Daylight length",
civilTwilightEnds: "Civil twilight ends",
darknessBegins: "Darkness begins",
darknessEnds: "Darkness ends",
visibleTonight: "Visible tonight",
visibleNow: "Visible now",
constellations: "Constellations",
planets: "Planets",
orbit: "ORBIT",
internationalSpaceStation: "International Space Station",
humansInSpace: "Humans in space",
spacecraftBreakdownPlaceholder: "Current spacecraft breakdown will appear here.",
footerMain: "Look Up calculates local astronomy in your browser and combines it with current public data.",
footerPrivacy: "Your chosen location is saved only on this device. Coordinates are sent only to the services needed for weather and place naming.",
location: "LOCATION",
locationQuestion: "Where should Look Up watch the sky?",
locationHelp: "Use your device location, or search for a city. Your browser will ask permission before sharing your location.",
useMyLocation: "Use my location",
or: "or",
chooseCity: "Choose a city",
search: "Search",
cityPlaceholder: "Saint-Eustache, Portland, Manjimup...",
privacyCopy: "Look Up does not have its own server or account system. If you use device location, your coordinates are stored in this browser and sent only to the public services needed to calculate local results.",
close: "Close",
weatherUnavailable: "weather unavailable",
daylight: "Daylight",
moonChip: "Moon",
planetSingular: "naked-eye planet",
planetPlural: "naked-eye planets",
tonight: "tonight",
visible: "visible",
humansInSpaceLower: "humans in space",
readingSky: "Reading the sky...",
combiningConditions: "Combining weather, visibility and moonlight...",
findingConstellations: "Finding well-placed constellations...",
checkingPlanets: "Checking the naked-eye planets...",
calculatingIss: "Calculating the next visible pass...",
checkingCrew: "Checking who is aboard each spacecraft...",
noGeolocation: "This browser does not support location access. Please choose a city instead.",
waitingPermission: "Waiting for location permission...",
permissionDenied: "Location permission was denied. No problem - choose a city below.",
locationFailed: "I couldn't get your location. Try again or choose a city below.",
currentLocation: "Current location",
searching: "Searching...",
noCities: "No matching cities found. Try a nearby city or a different spelling.",
chooseMatch: "Choose a match:",
citySearchUnavailable: "City search is temporarily unavailable. Please try again in a moment.",
bestWindowUnavailable: "A best viewing window will appear when a usable forecast is available.",
clearSkiesTonight: "Clear skies expected tonight",
someCloudTonight: "Some cloud tonight",
cloudsInterfereTonight: "Clouds may interfere tonight",
illuminatedMoon: "illuminated Moon",
poor: "Poor",
limited: "Limited",
fair: "Fair",
good: "Good",
excellent: "Excellent",
clearSky: "Clear sky",
someCloudCover: "Some cloud cover",
cloudy: "Cloudy",
heavyCloudCover: "Heavy cloud cover",
moonBelowHorizon: "Moon below the horizon",
lowMoonlight: "Low moonlight",
brightMoonlight: "Bright moonlight",
moderateMoonlight: "Moderate moonlight",
twilightFading: "Twilight is still fading",
bestViewing: "Best viewing",
belowHorizon: "Below the horizon",
below: "below",
nasaMoonAlt: "Current Moon phase, NASA/GSFC rendering",
constellationUnavailable: "Constellation data is temporarily unavailable.",
noConstellations: "No constellations meet the well-placed threshold for this time.",
around: "Around",
now: "NOW",
inThe: "in the",
noPlanetsTonight: "No naked-eye planets are well placed tonight.",
noPlanetsNow: "No naked-eye planets are well placed right now.",
bestAround: "best around",
magnitudeShort: "mag",
noIss: "No visible ISS pass was found in the next seven days, or pass data is temporarily unavailable.",
nextVisiblePass: "Next visible pass",
maximumAltitude: "Maximum altitude",
closestDistance: "Closest distance",
crewAboard: "Crew aboard",
issCloudNote: "A visible pass is predicted, but cloud cover may interfere.",
spacecraftUnavailable: "Spacecraft breakdown is temporarily unavailable.",
otherCrewedSpacecraft: "Other crewed spacecraft",
civilTwilight: "Civil twilight",
nauticalTwilight: "Nautical twilight",
astronomicalTwilight: "Astronomical twilight",
night: "Night",
newMoon: "New Moon",
waxingCrescent: "Waxing Crescent",
firstQuarter: "First Quarter",
waxingGibbous: "Waxing Gibbous",
fullMoon: "Full Moon",
waningGibbous: "Waning Gibbous",
lastQuarter: "Last Quarter",
waningCrescent: "Waning Crescent",
north: "North",
northNortheast: "North-northeast",
northeast: "Northeast",
eastNortheast: "East-northeast",
east: "East",
eastSoutheast: "East-southeast",
southeast: "Southeast",
southSoutheast: "South-southeast",
south: "South",
southSouthwest: "South-southwest",
southwest: "Southwest",
westSouthwest: "West-southwest",
west: "West",
westNorthwest: "West-northwest",
northwest: "Northwest",
northNorthwest: "North-northwest",
nearlyOverhead: "Nearly overhead",
high: "High",
mediumHigh: "Medium-high",
low: "Low",
veryLow: "Very low",
clear: "Clear",
mostlyClear: "Mostly clear",
partlyCloudy: "Partly cloudy",
overcast: "Overcast",
foggy: "Foggy",
drizzle: "Drizzle",
rain: "Rain",
snow: "Snow",
rainShowers: "Rain showers",
snowShowers: "Snow showers",
thunderstorms: "Thunderstorms",
conditionsAvailable: "Conditions available"
},
fr: {
personalSkyDashboard: "TABLEAU DE BORD C\u00c9LESTE PERSONNEL",
tagline: "Votre ciel, en ce moment.",
changeLocation: "Changer de lieu",
chooseLocation: "Choisir un lieu",
timeFormat: "Format de l\u2019heure",
language: "Langue",
rightNow: "EN CE MOMENT",
yourSkyRightNow: "Votre ciel en ce moment",
live: "EN DIRECT",
liveData: "Donn\u00e9es en direct",
chooseLocationToBegin: "Choisissez un lieu pour commencer.",
stargazing: "OBSERVATION",
observingConditions: "Conditions d\u2019observation",
waitingForLocation: "En attente d\u2019un lieu",
conditionsIntro: "La m\u00e9t\u00e9o, la visibilit\u00e9 et la lumi\u00e8re de la Lune seront combin\u00e9es ici.",
clouds: "Nuages",
precipitation: "Pr\u00e9cipitations",
temperature: "Temp\u00e9rature",
visibility: "Visibilit\u00e9",
bestWindowPlaceholder: "Le meilleur cr\u00e9neau d\u2019observation appara\u00eetra ici.",
moon: "LUNE",
nextMoonrise: "Prochain lever de Lune",
nextMoonset: "Prochain coucher de Lune",
nextFullMoon: "Prochaine pleine lune",
nextNewMoon: "Prochaine nouvelle lune",
sunDarkness: "SOLEIL & OBSCURIT\u00c9",
todaysLight: "Lumi\u00e8re du jour",
nextSunrise: "Prochain lever du soleil",
nextSunset: "Prochain coucher du soleil",
daylightLength: "Dur\u00e9e du jour",
civilTwilightEnds: "Fin du cr\u00e9puscule civil",
darknessBegins: "D\u00e9but de la nuit astronomique",
darknessEnds: "Fin de la nuit astronomique",
visibleTonight: "Visible ce soir",
visibleNow: "Visible maintenant",
constellations: "Constellations",
planets: "Plan\u00e8tes",
orbit: "ORBITE",
internationalSpaceStation: "Station spatiale internationale",
humansInSpace: "Humains dans l\u2019espace",
spacecraftBreakdownPlaceholder: "La r\u00e9partition par vaisseau appara\u00eetra ici.",
footerMain: "Look Up calcule l\u2019astronomie locale dans votre navigateur et la combine avec des donn\u00e9es publiques actuelles.",
footerPrivacy: "Le lieu choisi est enregistr\u00e9 uniquement sur cet appareil. Les coordonn\u00e9es sont envoy\u00e9es seulement aux services n\u00e9cessaires pour la m\u00e9t\u00e9o et le nom du lieu.",
location: "LIEU",
locationQuestion: "Depuis quel endroit Look Up doit-il observer le ciel ?",
locationHelp: "Utilisez la position de votre appareil ou recherchez une ville. Votre navigateur demandera votre permission avant de partager votre position.",
useMyLocation: "Utiliser ma position",
or: "ou",
chooseCity: "Choisir une ville",
search: "Rechercher",
cityPlaceholder: "Saint-Eustache, Portland, Manjimup...",
privacyCopy: "Look Up n\u2019a pas son propre serveur ni de syst\u00e8me de compte. Si vous utilisez la position de l\u2019appareil, vos coordonn\u00e9es sont enregistr\u00e9es dans ce navigateur et envoy\u00e9es seulement aux services publics n\u00e9cessaires aux r\u00e9sultats locaux.",
close: "Fermer",
weatherUnavailable: "m\u00e9t\u00e9o indisponible",
daylight: "Jour",
moonChip: "Lune",
planetSingular: "plan\u00e8te visible \u00e0 l\u2019\u0153il nu",
planetPlural: "plan\u00e8tes visibles \u00e0 l\u2019\u0153il nu",
tonight: "ce soir",
visible: "visibles",
humansInSpaceLower: "humains dans l\u2019espace",
readingSky: "Lecture du ciel...",
combiningConditions: "Combinaison de la m\u00e9t\u00e9o, de la visibilit\u00e9 et de la lumi\u00e8re lunaire...",
findingConstellations: "Recherche des constellations bien plac\u00e9es...",
checkingPlanets: "V\u00e9rification des plan\u00e8tes visibles \u00e0 l\u2019\u0153il nu...",
calculatingIss: "Calcul du prochain passage visible...",
checkingCrew: "V\u00e9rification des personnes \u00e0 bord de chaque vaisseau...",
noGeolocation: "Ce navigateur ne permet pas l\u2019acc\u00e8s \u00e0 la position. Choisissez plut\u00f4t une ville.",
waitingPermission: "En attente de l\u2019autorisation de localisation...",
permissionDenied: "L\u2019autorisation de localisation a \u00e9t\u00e9 refus\u00e9e. Aucun probl\u00e8me : choisissez une ville ci-dessous.",
locationFailed: "Impossible d\u2019obtenir votre position. R\u00e9essayez ou choisissez une ville ci-dessous.",
currentLocation: "Position actuelle",
searching: "Recherche...",
noCities: "Aucune ville correspondante trouv\u00e9e. Essayez une ville voisine ou une autre orthographe.",
chooseMatch: "Choisissez une correspondance :",
citySearchUnavailable: "La recherche de ville est temporairement indisponible. R\u00e9essayez dans un instant.",
bestWindowUnavailable: "Le meilleur cr\u00e9neau appara\u00eetra lorsqu\u2019une pr\u00e9vision utilisable sera disponible.",
clearSkiesTonight: "Ciel d\u00e9gag\u00e9 pr\u00e9vu ce soir",
someCloudTonight: "Quelques nuages ce soir",
cloudsInterfereTonight: "Les nuages pourraient g\u00eaner l\u2019observation ce soir",
illuminatedMoon: "de Lune \u00e9clair\u00e9e",
poor: "Mauvais",
limited: "Limit\u00e9",
fair: "Moyen",
good: "Bon",
excellent: "Excellent",
clearSky: "Ciel d\u00e9gag\u00e9",
someCloudCover: "Quelques nuages",
cloudy: "Nuageux",
heavyCloudCover: "Couverture nuageuse importante",
moonBelowHorizon: "Lune sous l\u2019horizon",
lowMoonlight: "Faible lumi\u00e8re lunaire",
brightMoonlight: "Forte lumi\u00e8re lunaire",
moderateMoonlight: "Lumi\u00e8re lunaire mod\u00e9r\u00e9e",
twilightFading: "Le cr\u00e9puscule se dissipe encore",
bestViewing: "Meilleur cr\u00e9neau",
belowHorizon: "Sous l\u2019horizon",
below: "en dessous",
nasaMoonAlt: "Phase lunaire actuelle, rendu NASA/GSFC",
constellationUnavailable: "Les donn\u00e9es sur les constellations sont temporairement indisponibles.",
noConstellations: "Aucune constellation ne respecte le seuil de bonne visibilit\u00e9 pour cette heure.",
around: "Vers",
now: "MAINTENANT",
inThe: "vers le",
noPlanetsTonight: "Aucune plan\u00e8te visible \u00e0 l\u2019\u0153il nu n\u2019est bien plac\u00e9e ce soir.",
noPlanetsNow: "Aucune plan\u00e8te visible \u00e0 l\u2019\u0153il nu n\u2019est bien plac\u00e9e en ce moment.",
bestAround: "meilleur vers",
magnitudeShort: "mag",
noIss: "Aucun passage visible de l\u2019ISS n\u2019a \u00e9t\u00e9 trouv\u00e9 dans les sept prochains jours, ou les donn\u00e9es sont temporairement indisponibles.",
nextVisiblePass: "Prochain passage visible",
maximumAltitude: "Altitude maximale",
closestDistance: "Distance minimale",
crewAboard: "Personnes \u00e0 bord",
issCloudNote: "Un passage visible est pr\u00e9vu, mais les nuages pourraient g\u00eaner l\u2019observation.",
spacecraftUnavailable: "La r\u00e9partition par vaisseau est temporairement indisponible.",
otherCrewedSpacecraft: "Autres vaisseaux habit\u00e9s",
civilTwilight: "Cr\u00e9puscule civil",
nauticalTwilight: "Cr\u00e9puscule nautique",
astronomicalTwilight: "Cr\u00e9puscule astronomique",
night: "Nuit",
newMoon: "Nouvelle lune",
waxingCrescent: "Premier croissant",
firstQuarter: "Premier quartier",
waxingGibbous: "Lune gibbeuse croissante",
fullMoon: "Pleine lune",
waningGibbous: "Lune gibbeuse d\u00e9croissante",
lastQuarter: "Dernier quartier",
waningCrescent: "Dernier croissant",
north: "Nord",
northNortheast: "Nord-nord-est",
northeast: "Nord-est",
eastNortheast: "Est-nord-est",
east: "Est",
eastSoutheast: "Est-sud-est",
southeast: "Sud-est",
southSoutheast: "Sud-sud-est",
south: "Sud",
southSouthwest: "Sud-sud-ouest",
southwest: "Sud-ouest",
westSouthwest: "Ouest-sud-ouest",
west: "Ouest",
westNorthwest: "Ouest-nord-ouest",
northwest: "Nord-ouest",
northNorthwest: "Nord-nord-ouest",
nearlyOverhead: "Presque au z\u00e9nith",
high: "Haut",
mediumHigh: "Assez haut",
low: "Bas",
veryLow: "Tr\u00e8s bas",
clear: "D\u00e9gag\u00e9",
mostlyClear: "G\u00e9n\u00e9ralement d\u00e9gag\u00e9",
partlyCloudy: "Partiellement nuageux",
overcast: "Couvert",
foggy: "Brouillard",
drizzle: "Bruine",
rain: "Pluie",
snow: "Neige",
rainShowers: "Averses de pluie",
snowShowers: "Averses de neige",
thunderstorms: "Orages",
conditionsAvailable: "Conditions disponibles"
}
};

function t(key) {
return I18N[state.language]?.[key] ?? I18N.en[key] ?? key;
}

function locale() {
return state.language === "fr" ? "fr-CA" : "en-CA";
}

function createLanguageToggle() {
if (el("languageToggle")) return;
const wrap = document.createElement("div");
wrap.className = "time-toggle language-toggle";
wrap.id = "languageToggle";
wrap.innerHTML = '<button id="langEnButton" class="toggle-button" type="button">EN</button><button id="langFrButton" class="toggle-button" type="button">FR</button>';
document.querySelector(".header-controls")?.appendChild(wrap);
}

function setLanguage(language) {
state.language = language === "fr" ? "fr" : "en";
localStorage.setItem(STORAGE_LANGUAGE, state.language);
document.documentElement.lang = state.language;
setLanguageToggle();
applyLanguage();
if (state.location) renderAllFromState();
}

function setLanguageToggle() {
el("langEnButton")?.classList.toggle("active", state.language === "en");
el("langFrButton")?.classList.toggle("active", state.language === "fr");
if (el("languageToggle")) el("languageToggle").setAttribute("aria-label", t("language"));
}

function setMetricLabel(valueId, key) {
const value = el(valueId);
if (value?.previousElementSibling) value.previousElementSibling.textContent = t(key);
}

function applyLanguage() {
document.documentElement.lang = state.language;
document.title = "Look Up";
const setText = (selector, key) => {
const node = document.querySelector(selector);
if (node) node.textContent = t(key);
};
setText(".eyebrow", "personalSkyDashboard");
setText(".tagline", "tagline");
el("locationButton")?.setAttribute("aria-label", t("changeLocation"));
document.querySelector(".time-toggle:not(.language-toggle)")?.setAttribute("aria-label", t("timeFormat"));
if (!state.location && el("locationLabel")) el("locationLabel").textContent = t("chooseLocation");
setText(".hero .card-kicker", "rightNow");
setText("#heroTitle", "yourSkyRightNow");
const live = document.querySelector(".live-dot");
if (live) {
live.innerHTML = `<span></span> ${escapeHtml(t("live"))}`;
live.title = t("liveData");
}
if (!state.location && el("heroSummary")) el("heroSummary").textContent = t("chooseLocationToBegin");
if (!state.location && el("visibilitySectionTitle")) el("visibilitySectionTitle").textContent = t("visibleTonight");
setText(".conditions-card .card-kicker", "stargazing");
setText("#conditionsTitle", "observingConditions");
setMetricLabel("cloudValue", "clouds");
setMetricLabel("precipValue", "precipitation");
setMetricLabel("tempValue", "temperature");
setMetricLabel("visibilityValue", "visibility");
if (!state.location) {
el("gaugeLabel").textContent = t("waitingForLocation");
el("gaugeSummary").textContent = t("conditionsIntro");
el("bestWindow").textContent = t("bestWindowPlaceholder");
}
setText(".moon-card .card-kicker", "moon");
setMetricLabel("moonriseValue", "nextMoonrise");
setMetricLabel("moonsetValue", "nextMoonset");
setMetricLabel("fullMoonValue", "nextFullMoon");
setMetricLabel("newMoonValue", "nextNewMoon");
el("moonImage")?.setAttribute("alt", t("nasaMoonAlt"));
setText("#sunTitle", "todaysLight");
const sunKicker = el("sunTitle")?.closest(".card-heading-row")?.querySelector(".card-kicker");
if (sunKicker) sunKicker.textContent = t("sunDarkness");
setMetricLabel("sunriseValue", "nextSunrise");
setMetricLabel("sunsetValue", "nextSunset");
setMetricLabel("dayLengthValue", "daylightLength");
setMetricLabel("civilDuskValue", "civilTwilightEnds");
setMetricLabel("astroDuskValue", "darknessBegins");
setMetricLabel("astroDawnValue", "darknessEnds");
setText("#constellationsTitle", "constellations");
setText("#planetsTitle", "planets");
const issKicker = el("issTitle")?.closest(".card-heading-row")?.querySelector(".card-kicker");
if (issKicker) issKicker.textContent = t("orbit");
setText("#issTitle", "internationalSpaceStation");
setText("#humansTitle", "humansInSpace");
if (!state.location) {
el("constellationList").innerHTML = `<p class="muted">${escapeHtml(t("waitingForLocation"))}.</p>`;
el("planetList").innerHTML = `<p class="muted">${escapeHtml(t("waitingForLocation"))}.</p>`;
el("issContent").innerHTML = `<p class="muted">${escapeHtml(t("waitingForLocation"))}.</p>`;
el("humanBreakdown").innerHTML = `<p class="muted">${escapeHtml(t("spacecraftBreakdownPlaceholder"))}</p>`;
}
const footer = document.querySelector("footer");
if (footer) {
const lines = footer.querySelectorAll("p");
if (lines[0]) lines[0].textContent = t("footerMain");
if (lines[2]) lines[2].textContent = t("footerPrivacy");
}
const modal = el("locationModal");
if (modal) {
const kicker = modal.querySelector(".card-kicker");
if (kicker) kicker.textContent = t("location");
el("locationModalTitle").textContent = t("locationQuestion");
const helper = modal.querySelector("#locationModalTitle + .muted");
if (helper) helper.textContent = t("locationHelp");
el("useLocationButton").textContent = `\uD83D\uDCCD ${t("useMyLocation")}`;
const orText = modal.querySelector(".or-divider span");
if (orText) orText.textContent = t("or");
const cityLabel = modal.querySelector('label[for="cityInput"]');
if (cityLabel) cityLabel.textContent = t("chooseCity");
el("cityInput").placeholder = t("cityPlaceholder");
const searchButton = modal.querySelector('#citySearchForm button[type="submit"]');
if (searchButton) searchButton.textContent = t("search");
const privacy = modal.querySelector(".privacy-copy");
if (privacy) privacy.textContent = t("privacyCopy");
el("closeLocationModal")?.setAttribute("aria-label", t("close"));
}
setLanguageToggle();
}

function init() {
createLanguageToggle();
setTimeToggle();
setLanguageToggle();
applyLanguage();
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
el("langEnButton").addEventListener("click", () => setLanguage("en"));
el("langFrButton").addEventListener("click", () => setLanguage("fr"));
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
el("locationStatus").textContent = t("noGeolocation");
return;
}
el("locationStatus").textContent = t("waitingPermission");
el("useLocationButton").disabled = true;
navigator.geolocation.getCurrentPosition(async position => {
const lat = position.coords.latitude;
const lon = position.coords.longitude;
let location = {
lat,
lon,
name: t("currentLocation"),
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
if (error.code === error.PERMISSION_DENIED) el("locationStatus").textContent = t("permissionDenied");
else el("locationStatus").textContent = t("locationFailed");
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
url.searchParams.set("accept-language", state.language);
const response = await fetch(url.toString(), {headers: {"Accept": "application/json"}});
if (!response.ok) throw new Error("Reverse geocoding failed");
const data = await response.json();
const a = data.address || {};
const name = a.city || a.town || a.village || a.municipality || a.county || t("currentLocation");
const region = a.state || a.province || a.region || "";
const country = a.country || "";
return {name, region, country};
}

async function searchCity() {
const query = el("cityInput").value.trim();
if (!query) return;
el("locationStatus").textContent = t("searching");
el("cityResults").innerHTML = "";
try {
const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
url.searchParams.set("name", query);
url.searchParams.set("count", "8");
url.searchParams.set("language", state.language);
url.searchParams.set("format", "json");
const response = await fetch(url.toString());
if (!response.ok) throw new Error("Search failed");
const data = await response.json();
const results = data.results || [];
if (!results.length) {
el("locationStatus").textContent = t("noCities");
return;
}
el("locationStatus").textContent = t("chooseMatch");
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
el("locationStatus").textContent = t("citySearchUnavailable");
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
el("locationLabel").textContent = parts.join(", ") || t("currentLocation");
}

async function refreshDashboard() {
if (!state.location) return;
setLoadingState();
const tasks = await Promise.allSettled([
fetchWeather(),
fetchHumanSpaceflightData(),
loadConstellationData(),
findNextVisibleIssPass()
]);
const weatherResult = tasks[0];
const humansResult = tasks[1];
const constellationsResult = tasks[2];
const issResult = tasks[3];
if (weatherResult.status === "fulfilled") state.weather = weatherResult.value;
if (humansResult.status === "fulfilled") {
state.humanCount = humansResult.value.count;
state.humanBreakdown = humansResult.value.breakdown;
state.issCrew = humansResult.value.issCrew;
}
if (constellationsResult.status === "fulfilled") state.constellationData = constellationsResult.value;
if (issResult.status === "fulfilled") state.issPass = issResult.value;
renderAllFromState();
}

function refreshAstronomyOnly() {
if (!state.location) return;
renderAllFromState();
}

function setLoadingState() {
el("heroSummary").textContent = t("readingSky");
el("heroChips").innerHTML = "";
el("gaugeSummary").textContent = t("combiningConditions");
el("constellationList").innerHTML = `<p class="muted">${escapeHtml(t("findingConstellations"))}</p>`;
el("planetList").innerHTML = `<p class="muted">${escapeHtml(t("checkingPlanets"))}</p>`;
el("issContent").innerHTML = `<p class="muted">${escapeHtml(t("calculatingIss"))}</p>`;
el("humanBreakdown").innerHTML = `<p class="muted">${escapeHtml(t("checkingCrew"))}</p>`;
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

async function fetchHumanSpaceflightData() {
if (state.humanDataFetchedAt && Date.now() - state.humanDataFetchedAt < HUMAN_DATA_REFRESH_MS && Number.isFinite(state.humanCount)) {
return {count: state.humanCount, breakdown: state.humanBreakdown, issCrew: state.issCrew};
}
const countUrl = "https://ll.thespacedevs.com/2.3.0/astronauts/?in_space=true&is_human=true&limit=1&format=json";
const expeditionsUrl = "https://ll.thespacedevs.com/2.3.0/expeditions/?is_active=true&mode=detailed&limit=20&format=json";
const [countResult, expeditionResult] = await Promise.allSettled([
fetch(countUrl).then(async response => {
if (!response.ok) throw new Error("Human count failed");
return response.json();
}),
fetch(expeditionsUrl).then(async response => {
if (!response.ok) throw new Error("Crew breakdown failed");
return response.json();
})
]);
let count = null;
if (countResult.status === "fulfilled" && Number.isFinite(countResult.value.count)) count = countResult.value.count;
const craft = new Map();
if (expeditionResult.status === "fulfilled") {
for (const expedition of expeditionResult.value.results || []) {
const station = expedition.spacestation || expedition.space_station;
const name = station?.name;
if (!name) continue;
if (!craft.has(name)) craft.set(name, new Set());
const people = craft.get(name);
for (const member of expedition.crew || expedition.crew_members || []) {
const astronaut = member.astronaut || member.person || member;
const key = astronaut?.id ?? astronaut?.name;
if (key !== undefined && key !== null) people.add(String(key));
}
}
}
let breakdown = [...craft.entries()].map(([name, people]) => ({name, count: people.size})).filter(item => item.count > 0);
breakdown.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
const known = breakdown.reduce((sum, item) => sum + item.count, 0);
if (!Number.isFinite(count) && known > 0) count = known;
if (Number.isFinite(count) && count > known) breakdown.push({name: "__other__", count: count - known});
const iss = breakdown.find(item => /international space station|^iss$/i.test(item.name));
if (!Number.isFinite(count) && !breakdown.length) throw new Error("Human spaceflight data failed");
state.humanDataFetchedAt = Date.now();
return {count, breakdown, issCrew: iss?.count ?? null};
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
nameEn: id === "Ser" ? "Serpens" : feature.properties?.name || id,
nameFr: id === "Ser" ? "Serpent" : feature.properties?.fr || feature.properties?.name || id,
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
const weatherText = state.weather ? weatherCodeText(state.weather.current?.weather_code) : t("weatherUnavailable");
const tempText = state.weather ? formatBothTemps(state.weather.current?.temperature_2m) : "";
const moonName = moonPhaseName(a.moonPhaseAngle);
const planetInfos = getPlanetInfos(a);
const visiblePlanets = planetInfos.filter(p => p.visible);
const timeContext = a.isDaylight ? t("daylight") : a.skyState;
const summaryParts = [timeContext, weatherText];
if (tempText) summaryParts.push(tempText);
summaryParts.push(state.language === "fr" ? `Lune : ${moonName}` : `${moonName} Moon`);
el("heroSummary").textContent = summaryParts.join(" \u00B7 ");
const chips = [];
chips.push(state.language === "fr" ? `\uD83C\uDF19 ${t("moonChip")} : ${Math.round(a.moonIllumination * 100)} %` : `\uD83C\uDF19 ${Math.round(a.moonIllumination * 100)}% ${t("moonChip")}`);
if (visiblePlanets.length) {
const planetWord = visiblePlanets.length === 1 ? t("planetSingular") : t("planetPlural");
chips.push(`\uD83E\uDE90 ${visiblePlanets.length} ${planetWord} ${a.isDaylight ? t("tonight") : t("visible")}`);
}
if (state.issPass) chips.push(`\uD83D\uDEF0\uFE0F ISS ${formatTime(state.issPass.start)}`);
if (Number.isFinite(state.humanCount)) chips.push(`\uD83D\uDC69\u200D\uD83D\uDE80 ${state.humanCount} ${t("humansInSpaceLower")}`);
el("heroChips").innerHTML = chips.map(text => `<span class="chip">${escapeHtml(text)}</span>`).join("");
}
function renderConditions(a) {
const currentWeather = getCurrentWeatherPoint();
if (a.isDaylight) {
setGauge(t("daylight"), null);
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
sunAltitude: a.sun.altitude
});
setGauge(rating.label, rating.index);
el("gaugeSummary").textContent = rating.reasons.join(" \u00B7 ");
}
el("cloudValue").textContent = Number.isFinite(currentWeather.cloud) ? `${Math.round(currentWeather.cloud)}%` : "\u2014";
el("precipValue").textContent = Number.isFinite(currentWeather.precipProbability) ? `${Math.round(currentWeather.precipProbability)}%` : Number.isFinite(currentWeather.precipitation) ? `${currentWeather.precipitation.toFixed(1)} mm` : "\u2014";
el("tempValue").textContent = Number.isFinite(currentWeather.temperature) ? formatBothTemps(currentWeather.temperature) : "\u2014";
el("visibilityValue").textContent = Number.isFinite(currentWeather.visibility) ? formatVisibility(currentWeather.visibility) : "\u2014";
el("bestWindow").textContent = calculateBestViewingWindow(a) || t("bestWindowUnavailable");
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
const best = getBestForecastPoint(a);
const pieces = [];
if (best) {
if (best.cloud <= 20) pieces.push(t("clearSkiesTonight"));
else if (best.cloud <= 50) pieces.push(t("someCloudTonight"));
else pieces.push(t("cloudsInterfereTonight"));
}
if (state.language === "fr") pieces.push(`${Math.round(a.moonIllumination * 100)} % ${t("illuminatedMoon")}`);
else pieces.push(`${Math.round(a.moonIllumination * 100)}% ${t("illuminatedMoon")}`);
return pieces.join(" \u00B7 ");
}
function scoreObservingConditions(input) {
let score = 100;
const reasons = [];
const cloud = finiteOr(input.cloud, 50);
const pop = finiteOr(input.precipProbability, 0);
const precipitation = finiteOr(input.precipitation, 0);
const visibility = finiteOr(input.visibility, 20000);
const humidity = finiteOr(input.humidity, 60);
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
if (input.sunAltitude > -6) score -= 35;
else if (input.sunAltitude > -12) score -= 20;
else if (input.sunAltitude > -18) score -= 10;
score = Math.max(0, Math.min(100, score));
let index = score >= 83 ? 4 : score >= 65 ? 3 : score >= 45 ? 2 : score >= 25 ? 1 : 0;
if (cloud >= 92) index = 0;
const labels = [t("poor"), t("limited"), t("fair"), t("good"), t("excellent")];
if (cloud <= 20) reasons.push(t("clearSky"));
else if (cloud <= 50) reasons.push(t("someCloudCover"));
else if (cloud <= 80) reasons.push(t("cloudy"));
else reasons.push(t("heavyCloudCover"));
if (input.moonAltitude <= 0) reasons.push(t("moonBelowHorizon"));
else if (input.moonIllumination < 0.25) reasons.push(t("lowMoonlight"));
else if (input.moonIllumination > 0.75) reasons.push(t("brightMoonlight"));
else reasons.push(t("moderateMoonlight"));
if (input.sunAltitude > -18 && input.sunAltitude <= -0.833) reasons.push(t("twilightFading"));
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
let start = a.tonight.dusk?.getTime() ?? Date.now();
let end = a.tonight.dawn?.getTime() ?? start + 12 * 60 * 60 * 1000;
if (end <= start) end = start + 12 * 60 * 60 * 1000;
const out = [];
for (let i = 0; i < hourly.time.length; i++) {
const time = new Date(hourly.time[i] * 1000);
if (time.getTime() < start || time.getTime() > end) continue;
const moon = horizontalForBody(Astronomy.Body.Moon, time, a.observer);
const sun = horizontalForBody(Astronomy.Body.Sun, time, a.observer);
if (sun.altitude > -18) continue;
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
sunAltitude: sun.altitude
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
let endTime = new Date(scores[end].weather.time.getTime() + 60 * 60 * 1000);
if (a.tonight.dawn && endTime > a.tonight.dawn) endTime = a.tonight.dawn;
return `${t("bestViewing")}: ${formatTime(startTime)}\u2013${formatTime(endTime)} \u00B7 ${scores[bestIndex].rating.label}`;
}

function renderMoon(a) {
const percent = Math.round(a.moonIllumination * 100);
el("moonPercent").textContent = state.language === "fr" ? `${percent} % \u00E9clair\u00E9e` : `${percent}% illuminated`;
el("moonPhase").textContent = moonPhaseName(a.moonPhaseAngle);
el("moonPosition").textContent = a.moon.altitude > 0
? (state.language === "fr" ? `${altitudeWords(a.moon.altitude)} \u00B7 ${compassDirection(a.moon.azimuth)} \u00B7 ${Math.round(a.moon.altitude)}\u00B0` : `${altitudeWords(a.moon.altitude)} in the ${compassDirection(a.moon.azimuth)} \u00B7 ${Math.round(a.moon.altitude)}\u00B0`)
: `${t("belowHorizon")} \u00B7 ${Math.round(Math.abs(a.moon.altitude))}\u00B0 ${t("below")}`;
el("moonriseValue").textContent = formatAstroTime(a.moonrise);
el("moonsetValue").textContent = formatAstroTime(a.moonset);
el("fullMoonValue").textContent = formatAstroDate(a.moonQuarters.nextFull);
el("newMoonValue").textContent = formatAstroDate(a.moonQuarters.nextNew);
renderMoonVisual(a.now, a.moonPhaseAngle);
}
function renderMoonVisual(date, phaseDegrees) {
const image = el("moonImage");
const canvas = el("moonCanvas");
const url = nasaMoonImageUrl(date);
if (!url) {
image.style.display = "none";
canvas.style.display = "block";
drawMoonFallback(phaseDegrees);
return;
}
canvas.style.display = "none";
image.style.display = "block";
if (image.dataset.url === url && image.complete && image.naturalWidth) return;
image.dataset.url = url;
image.alt = state.language === "fr" ? `Lune : ${moonPhaseName(phaseDegrees)}, rendu NASA/GSFC` : `${moonPhaseName(phaseDegrees)} Moon, NASA/GSFC rendering`;
image.onload = () => {
if (image.dataset.url !== url) return;
image.style.display = "block";
canvas.style.display = "none";
};
image.onerror = () => {
if (image.dataset.url !== url) return;
image.style.display = "none";
canvas.style.display = "block";
drawMoonFallback(phaseDegrees);
};
image.src = url;
}

function nasaMoonImageUrl(date) {
if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
if (date.getUTCFullYear() !== NASA_MOON_YEAR) return null;
const yearStart = Date.UTC(NASA_MOON_YEAR, 0, 1, 0, 0, 0);
const frame = Math.floor((date.getTime() - yearStart) / 3600000) + 1;
if (frame < 1 || frame > 8760) return null;
const number = String(frame).padStart(4, "0");
const base = state.location?.lat < 0 ? NASA_MOON_SOUTH_BASE : NASA_MOON_NORTH_BASE;
return `${base}${number}.jpg`;
}

function drawMoonFallback(phaseDegrees) {
const canvas = el("moonCanvas");
const ctx = canvas.getContext("2d");
const w = canvas.width;
const h = canvas.height;
const cx = w / 2;
const cy = h / 2;
const r = Math.min(w, h) * 0.43;
const displayPhase = state.location?.lat < 0 ? (360 - phaseDegrees) % 360 : phaseDegrees;
ctx.clearRect(0, 0, w, h);
ctx.save();
ctx.beginPath();
ctx.arc(cx, cy, r, 0, Math.PI * 2);
ctx.clip();
ctx.fillStyle = "#1a2029";
ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
ctx.save();
buildMoonLitPath(ctx, displayPhase, cx, cy, r);
ctx.clip();
const gradient = ctx.createRadialGradient(cx - r * 0.22, cy - r * 0.22, r * 0.08, cx, cy, r);
gradient.addColorStop(0, "#f7f8f5");
gradient.addColorStop(0.72, "#d8dce0");
gradient.addColorStop(1, "#aeb5bd");
ctx.fillStyle = gradient;
ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
ctx.restore();
ctx.restore();
ctx.beginPath();
ctx.arc(cx, cy, r, 0, Math.PI * 2);
ctx.strokeStyle = "rgba(225,240,255,0.22)";
ctx.lineWidth = 1.5;
ctx.stroke();
}

function buildMoonLitPath(ctx, phaseDegrees, cx, cy, r) {
const phase = ((phaseDegrees % 360) + 360) % 360;
const waxing = phase <= 180;
const radians = phase * Math.PI / 180;
const steps = 100;
const first = [];
const second = [];
for (let i = 0; i <= steps; i++) {
const yNorm = -1 + (2 * i / steps);
const halfWidth = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
const limb = halfWidth * r;
const terminator = (waxing ? Math.cos(radians) : -Math.cos(radians)) * limb;
const y = cy + yNorm * r;
if (waxing) {
first.push([cx + terminator, y]);
second.push([cx + limb, y]);
} else {
first.push([cx - limb, y]);
second.push([cx + terminator, y]);
}
}
ctx.beginPath();
ctx.moveTo(first[0][0], first[0][1]);
for (let i = 1; i < first.length; i++) ctx.lineTo(first[i][0], first[i][1]);
for (let i = second.length - 1; i >= 0; i--) ctx.lineTo(second[i][0], second[i][1]);
ctx.closePath();
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
if (!daily?.sunrise?.length || !daily?.sunset?.length) return "\u2014";
const now = Date.now() / 1000;
let index = 0;
for (let i = 0; i < daily.sunrise.length; i++) {
if (daily.sunset[i] >= now - 12 * 3600) {
index = i;
break;
}
}
const seconds = daily.sunset[index] - daily.sunrise[index];
if (!Number.isFinite(seconds) || seconds <= 0) return "\u2014";
const hours = Math.floor(seconds / 3600);
const minutes = Math.round((seconds % 3600) / 60);
return state.language === "fr" ? `${hours} h ${minutes} min` : `${hours}h ${minutes}m`;
}

function renderConstellations(a) {
const daylight = a.isDaylight;
el("visibilitySectionTitle").textContent = daylight ? t("visibleTonight") : t("visibleNow");
el("constellationTime").textContent = daylight ? `${t("around")} ${formatTime(a.evaluationTime)}` : t("now");
if (!state.constellationData) {
el("constellationList").innerHTML = `<p class="muted error-note">${escapeHtml(t("constellationUnavailable"))}</p>`;
return;
}
const items = getVisibleConstellations(a.evaluationTime, a.observer);
if (!items.length) {
el("constellationList").innerHTML = `<p class="muted">${escapeHtml(t("noConstellations"))}</p>`;
return;
}
el("constellationList").innerHTML = items.map(item => {
const position = state.language === "fr" ? `${altitudeWords(item.altitude)} \u00B7 ${compassDirection(item.azimuth)}` : `${altitudeWords(item.altitude)} in the ${compassDirection(item.azimuth)}`;
return `<div class="object-row"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(position)}</small></div><div class="object-altitude">${Math.round(item.altitude)}\u00B0</div></div>`;
}).join("");
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
name: state.language === "fr" ? meta.nameFr : meta.nameEn,
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
const infos = getPlanetInfos(a).filter(item => item.visible);
if (!infos.length) {
el("planetList").innerHTML = `<p class="muted">${escapeHtml(daylight ? t("noPlanetsTonight") : t("noPlanetsNow"))}</p>`;
return;
}
el("planetList").innerHTML = infos.map(item => {
const position = state.language === "fr" ? `${altitudeWords(item.altitude)} \u00B7 ${compassDirection(item.azimuth)}` : `${altitudeWords(item.altitude)} in the ${compassDirection(item.azimuth)}`;
return `<div class="object-row"><div><strong>${escapeHtml(planetName(item.body))}</strong><small>${escapeHtml(position)}${item.bestTime ? ` \u00B7 ${escapeHtml(t("bestAround"))} ${escapeHtml(formatTime(item.bestTime))}` : ""}</small></div><div class="object-altitude">${Math.round(item.altitude)}\u00B0 \u00B7 ${escapeHtml(t("magnitudeShort"))} ${item.magnitude.toFixed(1)}</div></div>`;
}).join("");
}
function getPlanetInfos(a) {
if (!a.isDaylight) {
return PLANETS.map(body => planetAtTime(body, a.now, a.observer)).map(info => ({...info, visible: planetVisible(info, a.now, a.observer), bestTime: null}));
}
return PLANETS.map(body => bestPlanetTonight(body, a.now, a.observer));
}

function planetName(body) {
if (state.language !== "fr") return String(body);
const names = {
Mercury: "Mercure",
Venus: "V\u00E9nus",
Mars: "Mars",
Jupiter: "Jupiter",
Saturn: "Saturne"
};
return names[String(body)] || String(body);
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
el("issContent").innerHTML = `<p class="muted">${escapeHtml(t("noIss"))}</p>`;
return;
}
const pass = state.issPass;
const cloud = weatherAt(pass.peakTime)?.cloud;
const cloudNote = Number.isFinite(cloud) && cloud >= 70 ? `<p class="muted">\u2601\uFE0F ${escapeHtml(t("issCloudNote"))}</p>` : "";
const crew = Number.isFinite(state.issCrew) ? `<div class="metric"><span>${escapeHtml(t("crewAboard"))}</span><strong>${state.issCrew}</strong></div>` : "";
el("issContent").innerHTML = `<p class="iss-main-time">${escapeHtml(formatTime(pass.start))}</p><p class="muted">${escapeHtml(t("nextVisiblePass"))}</p><p class="route-line">${escapeHtml(pass.startDirection)} \u2192 ${escapeHtml(pass.endDirection)}</p><div class="metric-grid three"><div class="metric"><span>${escapeHtml(t("maximumAltitude"))}</span><strong>${escapeHtml(altitudeWords(pass.maxElevation))} \u00B7 ${Math.round(pass.maxElevation)}\u00B0</strong></div><div class="metric"><span>${escapeHtml(t("closestDistance"))}</span><strong>~${Math.round(pass.closestDistanceKm)} km</strong></div>${crew}</div>${cloudNote}`;
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

function spacecraftName(name) {
if (name === "__other__") return t("otherCrewedSpacecraft");
if (state.language !== "fr") return name;
if (/international space station|^iss$/i.test(name)) return t("internationalSpaceStation");
if (/tiangong/i.test(name)) return "Station spatiale Tiangong";
return name;
}

function renderHumans() {
el("humanCount").textContent = Number.isFinite(state.humanCount) ? state.humanCount : "\u2014";
if (!state.humanBreakdown?.length) {
el("humanBreakdown").innerHTML = `<p class="muted">${escapeHtml(t("spacecraftUnavailable"))}</p>`;
return;
}
el("humanBreakdown").innerHTML = state.humanBreakdown.map(item => {
const name = spacecraftName(item.name);
return `<div class="human-craft-row"><strong>${escapeHtml(name)}</strong><span class="human-craft-count">${item.count}</span></div>`;
}).join("");
}
function describeSunAltitude(altitude) {
if (altitude >= -0.833) return t("daylight");
if (altitude >= -6) return t("civilTwilight");
if (altitude >= -12) return t("nauticalTwilight");
if (altitude >= -18) return t("astronomicalTwilight");
return t("night");
}
function moonPhaseName(angle) {
const a = ((angle % 360) + 360) % 360;
if (a < 22.5 || a >= 337.5) return t("newMoon");
if (a < 67.5) return t("waxingCrescent");
if (a < 112.5) return t("firstQuarter");
if (a < 157.5) return t("waxingGibbous");
if (a < 202.5) return t("fullMoon");
if (a < 247.5) return t("waningGibbous");
if (a < 292.5) return t("lastQuarter");
return t("waningCrescent");
}
function compassDirection(azimuth) {
const keys = ["north", "northNortheast", "northeast", "eastNortheast", "east", "eastSoutheast", "southeast", "southSoutheast", "south", "southSouthwest", "southwest", "westSouthwest", "west", "westNorthwest", "northwest", "northNorthwest"];
const index = Math.round((((azimuth % 360) + 360) % 360) / 22.5) % 16;
return t(keys[index]);
}
function altitudeWords(altitude) {
if (altitude >= 75) return t("nearlyOverhead");
if (altitude >= 50) return t("high");
if (altitude >= 25) return t("mediumHigh");
if (altitude >= 10) return t("low");
if (altitude >= 0) return t("veryLow");
return t("belowHorizon");
}
function weatherCodeText(code) {
const c = Number(code);
if (c === 0) return t("clear");
if (c === 1) return t("mostlyClear");
if (c === 2) return t("partlyCloudy");
if (c === 3) return t("overcast");
if (c === 45 || c === 48) return t("foggy");
if ([51,53,55,56,57].includes(c)) return t("drizzle");
if ([61,63,65,66,67].includes(c)) return t("rain");
if ([71,73,75,77].includes(c)) return t("snow");
if ([80,81,82].includes(c)) return t("rainShowers");
if ([85,86].includes(c)) return t("snowShowers");
if ([95,96,99].includes(c)) return t("thunderstorms");
return t("conditionsAvailable");
}
function formatBothTemps(celsius) {
if (!Number.isFinite(Number(celsius))) return "\u2014";
const c = Math.round(Number(celsius));
const f = Math.round(c * 9 / 5 + 32);
return `${c}\u00B0C \u00B7 ${f}\u00B0F`;
}

function formatVisibility(meters) {
if (!Number.isFinite(Number(meters))) return "\u2014";
const km = Number(meters) / 1000;
return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

function formatAstroTime(value) {
if (!value) return "\u2014";
const date = value.date || value;
return formatTime(date);
}

function formatAstroDate(value) {
if (!value) return "\u2014";
const date = value.date || value;
return new Intl.DateTimeFormat(locale(), {
timeZone: currentTimezone(),
month: "short",
day: "numeric"
}).format(date);
}

function formatTime(date) {
if (!date) return "\u2014";
return new Intl.DateTimeFormat(locale(), {
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
