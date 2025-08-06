import { mathPlugin } from "@/app/plugin/mathPlugin";
import { weatherPlugin } from "@/app/plugin/weatherPlugin";
import { calendarPlugin } from "@/app/plugin/calendarPlugin";
import { plugin_llm } from "../../../ai_agent/plugin_llm";

export async function processQuery(message: string): Promise<{
	pluginResult: string;
	initialReply: string;
}> {
	let pluginResult = "";
	let initialReply = "";

	// Use plugin_llm to classify the query
	const queryType = await plugin_llm(message);
	console.log(`Query classified as: ${queryType}`);

	// Handle based on classification
	if (queryType === "WEATHER") {
		try {
			const response = await weatherPlugin(message);
			if (response) {
				pluginResult = `Temperature in ${response.city}: ${response.temperature}°C`;
				initialReply = pluginResult;
			}
		} catch (error) {
			initialReply = "Sorry, couldn't fetch weather data.";
			console.log(error);
		}
	}
	// Check for math expressions
	else if (queryType === "MATH") {
		const mathResult = mathPlugin(message);
		if (mathResult) {
			pluginResult = mathResult;
			initialReply = mathResult;
		}
	}
	// Handle date and time queries
	else if (queryType === "DATE") {
		try {
			const dateResult = await calendarPlugin(message);
			if (dateResult) {
				pluginResult = dateResult;
				initialReply = dateResult;
			}
		} catch (error) {
			initialReply = "Sorry, couldn't process the date request.";
			console.log(error);
		}
	}

	return { pluginResult, initialReply };
}
