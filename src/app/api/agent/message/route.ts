import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherApi } from "openmeteo";

type Coordinates = { longitude: number; latitude: number; city: string };

async function geocoding(city: string): Promise<Coordinates> {
	const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
	const response = await fetch(url);
	const data = await response.json();
	const location = `${data.results[0].admin3},${data.results[0].admin2}`;
	const co_ordinates: Coordinates = {
		longitude: data.results[0].longitude,
		latitude: data.results[0].latitude,
		city: location,
	};
	return co_ordinates;
}

type WeatherCurrent = {
	time: Date;
	city: string;
	temperature: number;
	apparentTemperature: number;
	relativeHumidity: number;
	weatherCode: number;
};

async function weatherPlugin(query: string): Promise<WeatherCurrent> {
	const match = query.match(/weather in ([a-zA-Z\s]+)/i);
	const city: string = match ? match[1].trim() : "kolar";
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

	// Process first location. Add a for-loop for multiple locations or weather models
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

function mathPlugin(query: string): string | null {
	const match = query.match(/([-+*/\d\s.()]+)/);
	if (match) {
		try {
			// eslint-disable-next-line no-eval
			const result = eval(match[1]);
			return `The result is ${result}.`;
		} catch {
			return "Sorry, I couldn't evaluate that expression.";
		}
	}
	return null;
}

export async function POST(req: NextRequest) {
	const { message, session_id } = await req.json();

	let pluginResult = "";

	// Check for weather intent
	if (/weather in/i.test(message)) {
		const response = await weatherPlugin(message);
		if (response) {
			pluginResult = `Temperatures of ${response.city}: ${response.temperature}`;
		} else {
			pluginResult = "Sorry, couldn't fetch weather data.";
		}
	}
	// Check for math expression
	else if (
		/[\d\s.+\-*/()]+=[\s]*\?*$/.test(message) ||
		/[\d\s.+\-*/()]+/.test(message)
	) {
		const mathResult = mathPlugin(message);
		if (mathResult) pluginResult = mathResult;
	}

	let reply = "";
	if (pluginResult) {
		reply += `Plugin result: ${pluginResult}`;
	}

	return NextResponse.json({
		reply,
		session_id,
	});
}
