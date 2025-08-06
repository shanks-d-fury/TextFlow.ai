import { NextRequest, NextResponse } from "next/server";
import { weatherPlugin } from "../../../plugin/weatherPlugin";
import { mathPlugin } from "../../../plugin/mathPlugin";
import { mongoConversationStore } from "../../../../pages/api/mongoMemory";
import { plugin_llm } from "./ai_agent/plugin_llm";
import { agent_llm } from "./ai_agent/agent_llm";
import { retrieveContextForMessage } from "../../../../lib/rag";

export async function POST(req: NextRequest) {
	const { message, session_id } = await req.json();
	let pluginResult: string | null = "";
	let reply: string | null = "";

	// Use plugin_llm to classify the query
	const queryType = await plugin_llm(message);
	// console.log(queryType);

	// Handle based on classification
	if (queryType === "WEATHER") {
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
	else if (queryType === "MATH") {
		const mathResult = mathPlugin(message);
		if (mathResult) {
			pluginResult = mathResult;
			reply = mathResult;
		}
	}
	// Get conversation context for LLM
	const conversationContext =
		await mongoConversationStore.getSystemPromptContext(session_id);

	// Retrieve relevant context from knowledge base
	const retrievedContext = await retrieveContextForMessage(message);

	// Combine conversation history with retrieved context and plugin results
	const fullSystemContext = [
		conversationContext || "",
		retrievedContext ? `\n\nRelevant information:\n${retrievedContext}` : "",
		pluginResult ? `\n\n pluginResult:\n${pluginResult}` : "",
	]
		.filter(Boolean)
		.join("");

	// Use agent_llm to generate response
	reply = await agent_llm(message, fullSystemContext);

	// Store the question-response pair
	await mongoConversationStore.addMessage(
		session_id,
		message,
		reply,
		pluginResult
	);

	return NextResponse.json({
		reply,
		session_id,
	});
}
