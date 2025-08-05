import { NextRequest, NextResponse } from "next/server";
import { weatherPlugin, isWeatherQuery } from "./weatherPlugin";
import { mathPlugin, isMathQuery } from "./mathPlugin";

export async function POST(req: NextRequest) {
	const { message, session_id } = await req.json();

	let pluginResult = "";

	// Check for weather intent
	if (isWeatherQuery(message)) {
		try {
			const response = await weatherPlugin(message);
			if (response) {
				pluginResult = `Temperature in ${response.city}: ${response.temperature}°C`;
			}
		} catch (error) {
			pluginResult = "Sorry, couldn't fetch weather data.";
		}
	}
	// Check for math expression
	else if (isMathQuery(message)) {
		const mathResult = mathPlugin(message);
		if (mathResult) {
			pluginResult = mathResult;
		}
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
