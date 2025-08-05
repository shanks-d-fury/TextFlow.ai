import { NextRequest, NextResponse } from "next/server";
import { weatherPlugin, isWeatherQuery } from "./weatherPlugin";

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
	if (isWeatherQuery(message)) {
		try {
			const response = await weatherPlugin(message);
			if (response) {
				pluginResult = `Temperatures of : ${response.temperature}°C`;
			}
		} catch (error) {
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
