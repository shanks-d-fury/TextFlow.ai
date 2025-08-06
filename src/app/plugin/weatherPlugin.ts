import { fetchWeatherApi } from "openmeteo";
import { loadCitiesFromJSON } from "./cityLoader";

type Coordinates = { longitude: number; latitude: number; city: string };

type WeatherCurrent = {
	time: Date;
	city: string;
	temperature: number;
	apparentTemperature: number;
	relativeHumidity: number;
	weatherCode: number;
};

// Load cities from external file
const cities = loadCitiesFromJSON();

// Weather pattern matching
const weatherPatterns = [
	/weather\s+in\s+([a-zA-Z\s]+)/i,
	/weather\s+of\s+([a-zA-Z\s]+)/i,
	/([a-zA-Z\s]+)\s+weather/i,
	/what.*weather.*in\s+([a-zA-Z\s]+)/i,
	/how.*weather.*in\s+([a-zA-Z\s]+)/i,
	/temperature\s+in\s+([a-zA-Z\s]+)/i,
	/climate\s+in\s+([a-zA-Z\s]+)/i,
];

async function geocoding(city: string): Promise<Coordinates> {
	const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
	const response = await fetch(url);
	const data = await response.json();

	// Handle case where no results are found
	if (!data.results || data.results.length === 0) {
		throw new Error(`No location found for: ${city}`);
	}

	const result = data.results[0];
	const location =
		[result.admin3, result.admin2, result.name].filter(Boolean).join(", ") ||
		city;

	const co_ordinates: Coordinates = {
		longitude: result.longitude,
		latitude: result.latitude,
		city: location,
	};
	return co_ordinates;
}

function extractCityFromQuery(query: string): string {
	const lowerQuery = query.toLowerCase();

	// First, try pattern matching
	for (const pattern of weatherPatterns) {
		const match = query.match(pattern);
		if (match && match[1]) {
			const potentialCity = match[1].trim().toLowerCase();
			if (cities.has(potentialCity)) {
				return potentialCity;
			}
			// If exact match not found, return the potential city directly
			return potentialCity;
		}
	}

	// Fallback: scan entire query for any known city
	const words = lowerQuery.split(/\s+/);

	// Check individual words
	for (const word of words) {
		if (cities.has(word)) {
			return word;
		}
	}

	// Check multi-word cities (like "new york")
	for (let i = 0; i < words.length - 1; i++) {
		const twoWords = `${words[i]} ${words[i + 1]}`;
		if (cities.has(twoWords)) {
			return twoWords;
		}
	}

	// Ultimate fallback
	return "Bengaluru";
}

export async function weatherPlugin(query: string): Promise<WeatherCurrent> {
	const city = extractCityFromQuery(query);
	const co_ordinates: Coordinates = await geocoding(city);
	const params = {
		latitude: co_ordinates.latitude,
		longitude: co_ordinates.longitude,
		current: [
			"temperature_2m",
			"relative_humidity_2m",
			"apparent_temperature",
			"weather_code",
		],
	};
	const url = "https://api.open-meteo.com/v1/forecast";
	const responses = await fetchWeatherApi(url, params);

	// Process first location
	const response = responses[0];
	const utcOffsetSeconds = response.utcOffsetSeconds();
	const current = response.current()!;

	// Note: The order of weather variables in the URL query and the indices below need to match!
	const temperature_2m = current.variables(0)!.value();
	const relative_humidity = current.variables(1)!.value();
	const apparent_temperature = current.variables(2)!.value();
	const weather_code = current.variables(3)!.value();

	const weatherData = {
		current: {
			time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
			city: co_ordinates.city,
			temperature: temperature_2m ? temperature_2m : -1,
			relativeHumidity: relative_humidity ? relative_humidity : -1,
			apparentTemperature: apparent_temperature ? apparent_temperature : -1,
			weatherCode: weather_code ? weather_code : -1,
		},
	};
	return weatherData.current;
}
