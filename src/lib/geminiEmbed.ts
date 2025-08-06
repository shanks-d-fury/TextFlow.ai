// lib/geminiEmbed.ts
import { GoogleGenAI } from "@google/genai";

// Use lazy initialization instead of immediate client creation
let aiClient: GoogleGenAI | null = null;

function getAIClient() {
	if (!aiClient) {
		if (!process.env.GEMINI_API_KEY) {
			throw new Error("GEMINI_API_KEY not found in environment variables");
		}
		aiClient = new GoogleGenAI({
			apiKey: process.env.GEMINI_API_KEY,
		});
	}
	return aiClient;
}

export const generateEmbedding = async (text: string) => {
	// Get client only when needed
	const ai = getAIClient();
	const response = await ai.models.embedContent({
		model: "gemini-embedding-001",
		contents: [text],
		config: {
			outputDimensionality: 2048,
		},
	});

	// Assuming the API returns an array of embeddings
	return response.embeddings?.[0] ?? null;
};
