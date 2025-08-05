import { NextRequest, NextResponse } from "next/server";
import { weatherPlugin, isWeatherQuery } from "../../../plugin/weatherPlugin";
import { mathPlugin, isMathQuery } from "../../../plugin/mathPlugin";
import { mongoConversationStore } from "../../../../pages/api/mongoMemory";

export async function POST(req: NextRequest) {
	const { message, session_id } = await req.json();

	let pluginResult = "";
	let reply = "";

	// Check for weather intent
	if (isWeatherQuery(message)) {
		try {
			const response = await weatherPlugin(message);
			if (response) {
				pluginResult = `Temperature in ${response.city}: ${response.temperature}°C`;
				reply = pluginResult;
			}
		} catch (error) {
			reply = "Sorry, couldn't fetch weather data.";
			console.log(error);
		}
	}
	// Check for math expression
	else if (isMathQuery(message)) {
		const mathResult = mathPlugin(message);
		if (mathResult) {
			pluginResult = mathResult;
			reply = mathResult;
		}
	}

	if (!reply) {
		// Get conversation context for LLM
		const conversationContext =
			await mongoConversationStore.getSystemPromptContext(session_id);
		// TODO: Integrate your LLM here using the conversationContext

		if (conversationContext) {
			reply =
				"I understand. Based on our conversation, how can I help you further?";
		} else {
			reply = "Hello! How can I assist you today?";
		}
	}

	// Store the question-response pair
	await mongoConversationStore.addMessage(
		session_id,
		message, // question
		reply, // LLM response
		pluginResult // plugin result if any
	);

	return NextResponse.json({
		reply,
		session_id,
	});
}
