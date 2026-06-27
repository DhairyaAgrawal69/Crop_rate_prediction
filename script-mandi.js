
const crops = [
    "Wheat","Rice","Maize","Potato","Sugarcane",
    "Barley","Bajra","Jowar","Gram","Mustard",
    "Soybean","Groundnut","Cotton","Turmeric",
    "Onion","Tomato","Garlic","Chilli","Moong",
    "Urad","Arhar","Masoor","Peas","Sunflower",
    "Sesamum","Tea","Coffee","Apple","Banana",
    "Mango","Orange","Grapes","Papaya","Guava"
];
const cropSelect = document.querySelector("#crop");

crops.forEach(crop => {
    cropSelect.innerHTML += `
        <option value="${crop}">
            ${crop}
        </option>
    `;
});
const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
];
const stateSelect = document.querySelector("#state");

states.forEach(state => {
    stateSelect.innerHTML += `
        <option value="${state}">
            ${state}
        </option>
    `;
});
const mandiData = {

    "Uttar Pradesh": [
        "Kanpur Mandi",
        "Lucknow Mandi",
        "Agra Mandi",
        "Meerut Mandi",
        "Varanasi Mandi",
        "Prayagraj Mandi",
        "Bareilly Mandi",
        "Gorakhpur Mandi"
    ],

    "Punjab": [
        "Ludhiana Mandi",
        "Amritsar Mandi",
        "Patiala Mandi",
        "Jalandhar Mandi",
        "Bathinda Mandi"
    ],

    "Haryana": [
        "Karnal Mandi",
        "Hisar Mandi",
        "Rohtak Mandi",
        "Kurukshetra Mandi",
        "Panipat Mandi"
    ],

    "Rajasthan": [
        "Jaipur Mandi",
        "Kota Mandi",
        "Jodhpur Mandi",
        "Bikaner Mandi",
        "Ajmer Mandi"
    ],

    "Madhya Pradesh": [
        "Indore Mandi",
        "Bhopal Mandi",
        "Ujjain Mandi",
        "Gwalior Mandi",
        "Jabalpur Mandi"
    ],

    "Maharashtra": [
        "Pune Mandi",
        "Nagpur Mandi",
        "Nashik Mandi",
        "Kolhapur Mandi",
        "Aurangabad Mandi"
    ],

    "Gujarat": [
        "Ahmedabad Mandi",
        "Rajkot Mandi",
        "Surat Mandi",
        "Vadodara Mandi",
        "Bhavnagar Mandi"
    ],

    "Bihar": [
        "Patna Mandi",
        "Muzaffarpur Mandi",
        "Gaya Mandi",
        "Bhagalpur Mandi",
        "Purnia Mandi"
    ],

    "West Bengal": [
        "Kolkata Mandi",
        "Siliguri Mandi",
        "Durgapur Mandi",
        "Asansol Mandi",
        "Malda Mandi"
    ],

    "Karnataka": [
        "Bengaluru Mandi",
        "Mysuru Mandi",
        "Hubli Mandi",
        "Belagavi Mandi",
        "Mangaluru Mandi"
    ],

    "Tamil Nadu": [
        "Chennai Mandi",
        "Coimbatore Mandi",
        "Madurai Mandi",
        "Salem Mandi",
        "Tiruchirappalli Mandi"
    ],

    "Telangana": [
        "Hyderabad Mandi",
        "Warangal Mandi",
        "Karimnagar Mandi",
        "Nizamabad Mandi",
        "Khammam Mandi"
    ],

    "Andhra Pradesh": [
        "Vijayawada Mandi",
        "Guntur Mandi",
        "Visakhapatnam Mandi",
        "Kurnool Mandi",
        "Tirupati Mandi"
    ],

    "Chhattisgarh": [
        "Raipur Mandi",
        "Bilaspur Mandi",
        "Durg Mandi",
        "Korba Mandi",
        "Jagdalpur Mandi"
    ],

    "Odisha": [
        "Bhubaneswar Mandi",
        "Cuttack Mandi",
        "Sambalpur Mandi",
        "Rourkela Mandi",
        "Balasore Mandi"
    ]
};
const mandiSelect = document.querySelector("#mandi");

stateSelect.addEventListener("change", () => {

    const selectedState = stateSelect.value;

    mandiTom.clearOptions();

    if (!mandiData[selectedState]) return;

    mandiData[selectedState].forEach(mandi => {
        mandiTom.addOption({
            value: mandi,
            text: mandi
        });
    });

    mandiTom.refreshOptions(false);
});

new TomSelect("#crop");
new TomSelect("#state");
const mandiTom = new TomSelect("#mandi");
const searchButton = document.querySelector(".search-btn");
let currentMandiPrices = [];

const apiKey = "579b464db66ec23bdd0000019d2042486107481564a706686f79301f";
const apiUrl = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const mandiPricesBody = document.querySelector(".table-responsive table tbody");
const updatedLabel = document.querySelector(".text-muted");

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
    params.set("limit", "50");

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
        console.log("Loaded mandi prices:", prices.length, "records");
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

window.addEventListener("DOMContentLoaded", () => fetchMandiPrices(getFilterParams()));