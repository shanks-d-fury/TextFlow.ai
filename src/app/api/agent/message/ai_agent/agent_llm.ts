import { GoogleGenAI } from "@google/genai";

export async function agent_llm(
	message: string,
	systemContext: string
): Promise<string> {
	try {
		const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash-lite",
			contents: [{ role: "user", parts: [{ text: message }] }],
			config: {
				systemInstruction: process.env.SYSTEM_INSTRUCTION_AGENT + systemContext,
			},
		});

		return response.text || "I'm not sure how to respond to that.";
	} catch (error) {
		console.error("Error generating response:", error);
		return "I'm having trouble processing your request right now.";
	}
}
