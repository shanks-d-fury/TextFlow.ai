import { NextRequest, NextResponse } from "next/server";
import { mongoConversationStore } from "../../../../database/api/mongoMemory";
import { agent_llm } from "../../../../ai_agent/agent_llm";
import { retrieveContextForMessage } from "../../../../lib/rag";
import { processQuery } from "./queryType";

export async function POST(req: NextRequest) {
	const { message, session_id } = await req.json();

	// Process the query using the separate handler
	const { pluginResult, initialReply } = await processQuery(message);

	// Get conversation context for LLM
	const conversationContext =
		await mongoConversationStore.getSystemPromptContext(session_id);

	// Retrieve relevant context from knowledge base
	const retrievedContext = await retrieveContextForMessage(message);

	// Combine conversation history with retrieved context and plugin results
	const fullSystemContext = [
		conversationContext || "",
		retrievedContext ? `\n\nRelevant information:\n${retrievedContext}` : "",
		pluginResult ? `\n\nTool result:\n${pluginResult}` : "",
	]
		.filter(Boolean)
		.join("");

	// Use agent_llm to generate response
	const reply = await agent_llm(message, fullSystemContext);

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
