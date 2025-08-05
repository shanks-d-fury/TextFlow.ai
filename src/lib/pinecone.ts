// lib/pinecone.ts
import { Pinecone } from "@pinecone-database/pinecone";

// Don't initialize immediately - create a function instead
let pineconeClient: Pinecone | null = null;

function getPineconeClient() {
	if (!pineconeClient) {
		if (!process.env.PINECONE_API_KEY) {
			throw new Error("PINECONE_API_KEY not found in environment variables");
		}
		pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
	}
	return pineconeClient;
}

export const upsertToPinecone = async (
	vectors: { id: string; values: number[] | null; metadata: any }[]
) => {
	// Get client only when the function is called
	const pinecone = getPineconeClient();
	const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

	// Filter out vectors with null or invalid values
	const filteredVectors = vectors.filter(
		(v) => Array.isArray(v.values) && v.values.length > 0
	);
	if (filteredVectors.length === 0) {
		console.warn("No valid vectors to upsert.");
		return;
	}
	await index.upsert(
		filteredVectors as { id: string; values: number[]; metadata: any }[]
	);
};
