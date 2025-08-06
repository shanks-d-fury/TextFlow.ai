import { generateEmbedding } from "./geminiEmbed";
import { queryPinecone } from "./pinecone";
import { reduceDimensions } from "./dimensionReducer";

export async function retrieveContextForMessage(message: string) {
	// Generate embedding for the user message
	const embedding = await generateEmbedding(message);
	if (!embedding) return "";

	// Extract the numeric array from the ContentEmbedding object
	const embeddingValues = Array.isArray(embedding)
		? embedding
		: embedding.values;

	if (!embeddingValues) return "";

	// Reduce dimensions to match Pinecone's requirements
	const reducedEmbedding = reduceDimensions(embeddingValues);

	// Query Pinecone with the reduced embedding
	const results = await queryPinecone(reducedEmbedding);

	// Format the retrieved documents as context
	const contextParts = results.map((result) => {
		if (result.metadata) {
			return `Source: ${result.metadata.filename}\n${
				result.metadata.text || ""
			}`;
		} else {
			return "Source: Unknown\n";
		}
	});

	return contextParts.join("\n\n");
}
