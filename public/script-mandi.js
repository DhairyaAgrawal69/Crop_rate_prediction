
const cropSelect = document.querySelector("#crop");
const stateSelect = document.querySelector("#state");
const mandiSelect = document.querySelector("#mandi");

let cropTom;
let stateTom;
let mandiTom;

let crops = [];
let states = [];
let mandiData = {};

function createTomSelects() {
    cropTom = new TomSelect("#crop", {
        placeholder: "Select Crop"
    });

    stateTom = new TomSelect("#state", {
        placeholder: "Select State",
        onChange(value) {
            updateMandiOptions(value);
        }
    });

    mandiTom = new TomSelect("#mandi", {
        placeholder: "Select Mandi"
    });
}

function updateMandiOptions(selectedState) {
    if (!mandiTom) return;

    mandiTom.clearOptions();
    mandiTom.addOption({ value: "", text: "Select Mandi" });
    mandiTom.setValue("");

    const markets = mandiData[selectedState] || [];
    markets.forEach(mandi => {
        mandiTom.addOption({
            value: mandi,
            text: mandi
        });
    });

    mandiTom.refreshOptions(false);
}

function populateFilterOptions(records) {
    const cropSet = new Set();
    const stateSet = new Set();
    const mandiMap = {};

    records.forEach(item => {
        const crop = item.commodity?.trim();
        const state = item.state?.trim();
        const market = item.market?.trim();

        if (crop) cropSet.add(crop);
        if (state) stateSet.add(state);
        if (state && market) {
            mandiMap[state] = mandiMap[state] || new Set();
            mandiMap[state].add(market);
        }
    });

    crops = Array.from(cropSet).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    states = Array.from(stateSet).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    mandiData = Object.fromEntries(
        Object.entries(mandiMap).map(([state, marketSet]) => [
            state,
            Array.from(marketSet).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
        ])
    );

    if (cropTom) {
        cropTom.clearOptions();
        cropTom.addOption({ value: "", text: "Select Crop" });
        crops.forEach(crop => cropTom.addOption({ value: crop, text: crop }));
        cropTom.refreshOptions(false);
    }

    if (stateTom) {
        stateTom.clearOptions();
        stateTom.addOption({ value: "", text: "Select State" });
        states.forEach(state => stateTom.addOption({ value: state, text: state }));
        stateTom.refreshOptions(false);
    }

    if (mandiTom) {
        mandiTom.clearOptions();
        mandiTom.addOption({ value: "", text: "Select Mandi" });
        mandiTom.refreshOptions(false);
    }
}

async function loadFilterOptions() {
    const pageSize = 1000;
    let offset = 0;
    let allRecords = [];

    while (true) {
        const params = new URLSearchParams();
        params.set("format", "json");
        params.set("api-key", apiKey);
        params.set("limit", String(pageSize));
        params.set("offset", String(offset));
        params.set("fields", "commodity,state,market");

        const url = `${apiUrl}?${params.toString()}`;
        console.log("Loading filter options from API:", url);

        try {
            const response = await fetch(url, { headers: { Accept: "application/json" } });
            if (!response.ok) {
                console.error("Failed to load filter options:", response.status, response.statusText);
                break;
            }

            const json = await response.json();
            const records = Array.isArray(json.records) ? json.records : [];
            allRecords.push(...records);

            if (records.length < pageSize) {
                break;
            }

            offset += pageSize;
        } catch (error) {
            console.error("Error loading filter options:", error);
            break;
        }
    }

    populateFilterOptions(allRecords);
}

createTomSelects();
const searchButton = document.querySelector(".search-btn");

stateSelect.addEventListener("change", () => {
    updateMandiOptions(stateSelect.value);
});

let currentMandiPrices = [];

const apiKey = "579b464db66ec23bdd0000019d2042486107481564a706686f79301f";
const apiUrl = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const mandiPricesBody = document.querySelector(".table-responsive table tbody");
const updatedLabel = document.querySelector(".text-muted");
const prevPageButton = document.querySelector("#prev-page");
const nextPageButton = document.querySelector("#next-page");
const pageInfoLabel = document.querySelector("#page-info");
const pageSizeSelect = document.querySelector("#page-size");

let currentPage = 1;
let pageSize = Number(pageSizeSelect?.value ?? 20) || 20;
let totalRecords = 0;
let totalPages = 1;

function formatChange(change) {
    if (typeof change !== "number") return change || "";
    const direction = change >= 0 ? "text-success" : "text-danger";
    return `<span class=\"${direction}\">${change >= 0 ? "+" : ""}${change.toFixed(1)}%</span>`;
}

function formatTrend(change) {
    if (typeof change !== "number") return "";
    return change >= 0 ? "📈" : "📉";
}

function renderMandiPrices(prices) {
    if (!mandiPricesBody) return;
    mandiPricesBody.innerHTML = "";

    if (!Array.isArray(prices) || prices.length === 0) {
        mandiPricesBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No mandi price data available.</td>
            </tr>
        `;
        return;
    }

    prices.forEach(item => {
        const parseNumber = value => {
            const num = Number(value);
            return Number.isFinite(num) ? num : null;
        };

        const crop = item.commodity || item.Commodity || item.crop || item.Crop || item.crop_name || item.cropName || "-";
        const mandi = item.market || item.Market || item.mandi || item.Mandi || item.mandi_name || item.mandiName || "-";
        const state = item.state || item.State || item.region || item.state_name || item.State || item.state || "-";

        const minPrice = parseNumber(item.min_price ?? item.minPrice ?? item.Min_x0020_Price);
        const maxPrice = parseNumber(item.max_price ?? item.maxPrice ?? item.Max_x0020_Price);
        const modalPrice = parseNumber(item.modal_price ?? item.modalPrice ?? item.Modal_x0020_Price);
        const explicitChange = parseNumber(item.change ?? item.Change ?? item.price_change ?? item.change_percent);

        const priceValue = modalPrice ?? minPrice ?? maxPrice;
        const computedChange = explicitChange ?? ((minPrice !== null && maxPrice !== null) ? maxPrice - minPrice : null);
        const computedTrend = explicitChange !== null
            ? formatTrend(explicitChange)
            : (modalPrice !== null && minPrice !== null && maxPrice !== null)
                ? (modalPrice >= (minPrice + maxPrice) / 2 ? "📈" : "📉")
                : "-";

        const priceText = priceValue !== null ? `₹${priceValue}` : "-";
        const changeText = computedChange !== null
            ? (explicitChange !== null ? formatChange(computedChange) : `₹${computedChange}`)
            : "-";

        mandiPricesBody.innerHTML += `
            <tr>
                <td>${crop}</td>
                <td>${mandi}</td>
                <td>${state}</td>
                <td>${priceText}</td>
                <td>${changeText}</td>
                <td>${computedTrend}</td>
            </tr>
        `;
    });
}

function getFilterParams() {
    const params = new URLSearchParams();
    params.set("format", "json");
    params.set("api-key", apiKey);
    params.set("limit", String(pageSize));
    params.set("offset", String((currentPage - 1) * pageSize));

    const cropValue = cropSelect.value.trim();
    const stateValue = stateSelect.value.trim();
    const mandiValue = mandiSelect.value.trim();

    if (cropValue) params.set("filters[commodity]", cropValue);
    if (stateValue) params.set("filters[state.keyword]", stateValue);
    if (mandiValue) params.set("filters[market]", mandiValue);

    return params;
}

function applyClientFilters(prices, filters) {
    return prices.filter(item => {
        const crop = (item.crop || item.Crop || item.crop_name || item.cropName || item.Commodity || item.commodity || "").toString().toLowerCase();
        const state = (item.state || item.State || item.region || item.state_name || item.State || item.state || "").toString().toLowerCase();
        const mandi = (item.mandi || item.Mandi || item.market || item.mandi_name || item.Market || item.market || "").toString().toLowerCase();

        if (filters.crop && !crop.includes(filters.crop.toLowerCase())) return false;
        if (filters.state && !state.includes(filters.state.toLowerCase())) return false;
        if (filters.mandi && !mandi.includes(filters.mandi.toLowerCase())) return false;
        return true;
    });
}

async function fetchMandiPrices(filters = new URLSearchParams()) {
    if (!apiUrl || apiUrl.includes("example.com")) {
        console.warn("Replace apiUrl with the actual mandi prices API endpoint.");
        return;
    }

    const url = filters.toString() ? `${apiUrl}?${filters.toString()}` : apiUrl;
    console.log("Fetching mandi prices from:", url);

    if (mandiPricesBody) {
        mandiPricesBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Loading mandi prices...</td>
            </tr>
        `;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            console.error("Failed to load mandi prices:", response.status, response.statusText);
            if (mandiPricesBody) {
                mandiPricesBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger">Unable to load mandi prices. (${response.status})</td>
                    </tr>
                `;
            }
            return;
        }

        const json = await response.json();
        console.log("API response:", json);
        const prices = Array.isArray(json) ? json : (json.records || json.data || json.prices || json.results || []);
        // derive totalRecords from API if available so pagination works
        totalRecords = Number(json.total ?? json.count ?? prices.length) || prices.length;
        updatePaginationControls();
        console.log("Loaded mandi prices:", prices.length, "records", "totalRecords:", totalRecords);
        currentMandiPrices = prices;
        renderMandiPrices(prices);
        if (updatedLabel) {
            const now = new Date();
            const formatted = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
            updatedLabel.textContent = `Updated: ${formatted}`;
        }
    } catch (error) {
        console.error("Error fetching mandi prices:", error);
        if (mandiPricesBody) {
            mandiPricesBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">Error loading mandi prices. Check console for details.</td>
                </tr>
            `;
        }
    }
}

if (searchButton) {
    searchButton.addEventListener("click", event => {
        event.preventDefault();
        currentPage = 1;
        const filters = getFilterParams();

        if (apiUrl && !apiUrl.includes("example.com")) {
            fetchMandiPrices(filters);
        } else {
            const filtered = applyClientFilters(currentMandiPrices, {
                crop: cropSelect.value,
                state: stateSelect.value,
                mandi: mandiSelect.value
            });
            renderMandiPrices(filtered);
        }
    });
}

function updatePaginationControls() {
    totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    if (pageInfoLabel) {
        pageInfoLabel.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    if (prevPageButton) {
        prevPageButton.disabled = currentPage <= 1;
    }
    if (nextPageButton) {
        nextPageButton.disabled = currentPage >= totalPages;
    }
}

if (prevPageButton) {
    prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage -= 1;
            fetchMandiPrices(getFilterParams());
        }
    });
}

if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            fetchMandiPrices(getFilterParams());
        }
    });
}

if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
        pageSize = Number(pageSizeSelect.value) || 20;
        currentPage = 1;
        fetchMandiPrices(getFilterParams());
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    await loadFilterOptions();
    fetchMandiPrices(getFilterParams());
});