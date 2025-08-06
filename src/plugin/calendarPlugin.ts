/**
 * Calendar plugin for handling date and time queries
 */
export async function calendarPlugin(query: string): Promise<string> {
	const now = new Date();

	// Enhanced patterns for date queries
	const datePatterns = [
		/what(?:'s| is)? (?:the )?(?:current |today'?s? )?date/i,
		/what (?:day|date) is (?:it|today)/i,
		/today'?s date/i,
		/what day of the week is it/i,
		/tell me (?:the )?(?:current )?date/i,
		/show (?:me )?(?:the )?date/i,
	];

	// Enhanced patterns for time queries
	const timePatterns = [
		/what(?:'s| is)? (?:the )?(?:current )?time/i,
		/what time is it/i,
		/tell me (?:the )?(?:current )?time/i,
		/show (?:me )?(?:the )?time/i,
		/current time/i,
		/time now/i,
		/local time/i,
		/(?:get|check)(?: the)? time/i,
	];

	// Full date-time pattern
	const dateTimePatterns = [
		/current date(?:\s+and|\s+&)?\s+time/i,
		/date(?:\s+and|\s+&)?\s+time/i,
		/time(?:\s+and|\s+&)?\s+date/i,
		/what(?:'s| is) (?:the )?(?:current )?date and time/i,
		/tell me (?:the )?date and time/i,
	];

	// Date formatting options
	const dateOptions: Intl.DateTimeFormatOptions = {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	};

	// Enhanced time formatting options
	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
		hour12: true,
		timeZoneName: "short",
	};

	// Debug log
	console.log(`Calendar plugin processing query: "${query}"`);

	// First check date and time query (most specific)
	if (dateTimePatterns.some((pattern) => pattern.test(query))) {
		console.log("Matched date-time pattern");
		return `Current date and time: ${now.toLocaleDateString(
			"en-US",
			dateOptions
		)} at ${now.toLocaleTimeString("en-US", timeOptions)}`;
	}

	// Check for time-only query
	if (timePatterns.some((pattern) => pattern.test(query))) {
		console.log("Matched time-only pattern");
		return `The current time is ${now.toLocaleTimeString(
			"en-US",
			timeOptions
		)}`;
	}

	// Check for date-only query
	if (datePatterns.some((pattern) => pattern.test(query))) {
		console.log("Matched date-only pattern");
		return `Today is ${now.toLocaleDateString("en-US", dateOptions)}`;
	}

	// Enhanced generic detection - prioritize time if "time" appears in the query
	if (/time/i.test(query)) {
		console.log("Generic time match");
		return `The current time is ${now.toLocaleTimeString(
			"en-US",
			timeOptions
		)}`;
	}

	// Default response if general date/time query detected
	if (/date|day|calendar/i.test(query)) {
		console.log("Generic date match");
		return `Today is ${now.toLocaleDateString(
			"en-US",
			dateOptions
		)} and the time is ${now.toLocaleTimeString("en-US", timeOptions)}`;
	}

	console.log("No calendar/time patterns matched");
	return "";
}
