import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

export async function plugin_llm(message: string): Promise<string> {
	try {
		const response = await ai.models.generateContent({
			model: "gemini-2.0-flash-lite",
			contents: [{ role: "user", parts: [{ text: message }] }],
			config: {
				systemInstruction: process.env.SYSTEM_INSTRUCTION_PLUGIN,
			},
		});
		// Return the classification result
		return response.text?.trim().toUpperCase() || "OTHERS";
	} catch (error) {
		console.error("Error classifying message:", error);
		return "OTHERS";
	}
}
