/**
 * Calendar plugin for handling date and time queries
 */
export async function calendarPlugin(query: string): Promise<string> {
	const now = new Date();

	// Patterns to match different types of date/time queries
	const datePatterns = [
		/what(?:'s| is)? (?:the )?(?:current |today'?s? )?date/i,
		/what (?:day|date) is (?:it|today)/i,
		/today'?s date/i,
		/what day of the week is it/i,
	];

	const timePatterns = [
		/what(?:'s| is)? (?:the )?(?:current )?time/i,
		/what time is it/i,
	];

	// Full date-time pattern
	const dateTimePatterns = [
		/current date(?:\s+and|\s+&)?\s+time/i,
		/date(?:\s+and|\s+&)?\s+time/i,
	];

	// Date formatting options
	const dateOptions: Intl.DateTimeFormatOptions = {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	};

	// Time formatting options
	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: "numeric",
		minute: "numeric",
		hour12: true,
	};

	// Check for date and time query
	if (dateTimePatterns.some((pattern) => pattern.test(query))) {
		return `Current date and time: ${now.toLocaleDateString(
			"en-US",
			dateOptions
		)} at ${now.toLocaleTimeString("en-US", timeOptions)}`;
	}

	// Check for date-only query
	if (datePatterns.some((pattern) => pattern.test(query))) {
		return `Today is ${now.toLocaleDateString("en-US", dateOptions)}`;
	}

	// Check for time-only query
	if (timePatterns.some((pattern) => pattern.test(query))) {
		return `The current time is ${now.toLocaleTimeString(
			"en-US",
			timeOptions
		)}`;
	}

	// Default response if no specific pattern matches but general date/time query detected
	if (/date|time|day|calendar/i.test(query)) {
		return `Today is ${now.toLocaleDateString(
			"en-US",
			dateOptions
		)} and the time is ${now.toLocaleTimeString("en-US", timeOptions)}`;
	}

	return "";
}
