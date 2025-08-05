// lib/readMarkdown.ts
import fs from "fs";
import path from "path";

export const loadMarkdownFiles = (
	dir: string
): { name: string; content: string }[] => {
	const files = fs.readdirSync(dir);
	return files
		.filter((file) => file.endsWith(".md"))
		.map((file) => ({
			name: file,
			content: fs.readFileSync(path.join(dir, file), "utf-8"),
		}));
};
