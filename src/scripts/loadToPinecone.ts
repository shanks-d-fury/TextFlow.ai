// scripts/loadToPinecone.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { loadMarkdownFiles } from "@/lib/readMarkdown";
import { generateEmbedding } from "@/lib/geminiEmbed";
import { upsertToPinecone } from "@/lib/pinecone";
import { reduceDimensions } from "../lib/dimensionReducer";

const run = async () => {
	const files = loadMarkdownFiles("../lib/documents");

	const vectorData = await Promise.all(
		files.map(async (file, idx) => {
			const embedding = await generateEmbedding(file.content);
			// Process and reduce dimensions to 2048
			const rawValues = Array.isArray(embedding)
				? embedding
				: embedding?.values;

			// Reduce dimensions to 2048 (max allowed)
			const values = rawValues ? reduceDimensions(rawValues, 2048) : null;

			return {
				id: `doc-${idx}`,
				values,
				metadata: { filename: file.name },
			};
		})
	);

	await upsertToPinecone(vectorData);
};

run();
