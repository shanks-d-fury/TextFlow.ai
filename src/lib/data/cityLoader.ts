import fs from "fs";
import path from "path";

let citiesSet: Set<string> | null = null;

// Alternative: Load from JSON for better performance
export function loadCitiesFromJSON(): Set<string> {
	if (citiesSet) {
		return citiesSet;
	}

	try {
		const jsonPath = path.join(
			process.cwd(),
			"src",
			"lib",
			"data",
			"cities.json"
		);
		const jsonContent = fs.readFileSync(jsonPath, "utf-8");
		const data = JSON.parse(jsonContent);

		citiesSet = new Set(data.cities.map((city: string) => city.toLowerCase()));
		return citiesSet;
	} catch (error) {
		console.error("Error loading cities from JSON:", error);
		citiesSet = new Set([
			"london",
			"paris",
			"mumbai",
			"delhi",
			"bangalore",
			"bengaluru",
		]);
		return citiesSet;
	}
}
