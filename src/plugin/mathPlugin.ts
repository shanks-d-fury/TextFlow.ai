// Advanced math operations and functions
const mathFunctions = {
	// Basic arithmetic
	add: (a: number, b: number) => a + b,
	subtract: (a: number, b: number) => a - b,
	multiply: (a: number, b: number) => a * b,
	divide: (a: number, b: number) => (b !== 0 ? a / b : NaN),

	// Power and roots
	power: (base: number, exponent: number) => Math.pow(base, exponent),
	sqrt: (n: number) => Math.sqrt(n),
	cbrt: (n: number) => Math.cbrt(n),

	// Trigonometric functions
	sin: (n: number) => Math.sin(n),
	cos: (n: number) => Math.cos(n),
	tan: (n: number) => Math.tan(n),
	asin: (n: number) => Math.asin(n),
	acos: (n: number) => Math.acos(n),
	atan: (n: number) => Math.atan(n),

	// Logarithmic functions
	log: (n: number) => Math.log(n),
	log10: (n: number) => Math.log10(n),
	log2: (n: number) => Math.log2(n),

	// Rounding functions
	round: (n: number) => Math.round(n),
	floor: (n: number) => Math.floor(n),
	ceil: (n: number) => Math.ceil(n),

	// Absolute and sign
	abs: (n: number) => Math.abs(n),
	sign: (n: number) => Math.sign(n),

	// Min/Max
	min: (...args: number[]) => Math.min(...args),
	max: (...args: number[]) => Math.max(...args),

	// Factorial
	factorial: (n: number): number => {
		if (n < 0 || !Number.isInteger(n)) return NaN;
		if (n <= 1) return 1;
		return n * mathFunctions.factorial(n - 1);
	},

	// Percentage
	percentage: (value: number, total: number) => (value / total) * 100,

	// Average
	average: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,

	// Constants
	pi: () => Math.PI,
	e: () => Math.E,
};

// Math query patterns
const mathPatterns = [
	// Basic arithmetic patterns
	/what\s+is\s+([\d\s.+\-*/()]+)\s*[?]?/i,
	/calculate\s+([\d\s.+\-*/()]+)/i,
	/solve\s+([\d\s.+\-*/()]+)/i,
	/([\d\s.+\-*/()]+)\s*=\s*[?]?/i,
	/([\d\s.+\-*/()]+)/i,

	// Function patterns
	/square\s+root\s+of\s+([\d.]+)/i,
	/sqrt\s*\(\s*([\d.]+)\s*\)/i,
	/cube\s+root\s+of\s+([\d.]+)/i,
	/([\d.]+)\s*\^\s*([\d.]+)/i,
	/([\d.]+)\s+to\s+the\s+power\s+of\s+([\d.]+)/i,

	// Trigonometric patterns
	/sin\s*\(\s*([\d.]+)\s*\)/i,
	/cos\s*\(\s*([\d.]+)\s*\)/i,
	/tan\s*\(\s*([\d.]+)\s*\)/i,

	// Percentage patterns
	/what\s+is\s+([\d.]+)%\s+of\s+([\d.]+)/i,
	/([\d.]+)%\s+of\s+([\d.]+)/i,
	/([\d.]+)\s+percent\s+of\s+([\d.]+)/i,

	// Factorial pattern
	/([\d]+)!/i,
	/factorial\s+of\s+([\d]+)/i,

	// Average pattern
	/average\s+of\s+([\d\s,]+)/i,
	/mean\s+of\s+([\d\s,]+)/i,
];

function evaluateExpression(expression: string): number {
	try {
		// Clean the expression
		const cleanExpr = expression.replace(/[^0-9+\-*/.() ]/g, "");

		// Replace common symbols
		const processedExpr = cleanExpr
			.replace(/×/g, "*")
			.replace(/÷/g, "/")
			.replace(/\s+/g, "");

		// Validate expression (only allow safe characters)
		if (!/^[0-9+\-*/.() ]+$/.test(processedExpr)) {
			throw new Error("Invalid expression");
		}

		// eslint-disable-next-line no-eval
		return eval(processedExpr);
	} catch {
		throw new Error("Could not evaluate expression");
	}
}

function processSpecialFunctions(query: string): string | null {
	const lowerQuery = query.toLowerCase();

	// Square root
	let match = lowerQuery.match(
		/square\s+root\s+of\s+([\d.]+)|sqrt\s*\(\s*([\d.]+)\s*\)/i
	);
	if (match) {
		const num = parseFloat(match[1] || match[2]);
		return `√${num} = ${mathFunctions.sqrt(num).toFixed(4)}`;
	}

	// Cube root
	match = lowerQuery.match(/cube\s+root\s+of\s+([\d.]+)/i);
	if (match) {
		const num = parseFloat(match[1]);
		return `∛${num} = ${mathFunctions.cbrt(num).toFixed(4)}`;
	}

	// Power
	match = lowerQuery.match(
		/([\d.]+)\s*\^\s*([\d.]+)|([\d.]+)\s+to\s+the\s+power\s+of\s+([\d.]+)/i
	);
	if (match) {
		const base = parseFloat(match[1] || match[3]);
		const exp = parseFloat(match[2] || match[4]);
		return `${base}^${exp} = ${mathFunctions.power(base, exp).toFixed(4)}`;
	}

	// Trigonometric functions
	match = lowerQuery.match(/(sin|cos|tan)\s*\(\s*([\d.]+)\s*\)/i);
	if (match) {
		const func = match[1].toLowerCase();
		const num = parseFloat(match[2]);
		let result: number;
		if (func === "sin") {
			result = mathFunctions.sin(num);
		} else if (func === "cos") {
			result = mathFunctions.cos(num);
		} else if (func === "tan") {
			result = mathFunctions.tan(num);
		} else {
			return null;
		}
		return `${func}(${num}) = ${result.toFixed(4)}`;
	}

	// Percentage
	match = lowerQuery.match(
		/what\s+is\s+([\d.]+)%\s+of\s+([\d.]+)|([\d.]+)%\s+of\s+([\d.]+)|([\d.]+)\s+percent\s+of\s+([\d.]+)/i
	);
	if (match) {
		const percent = parseFloat(match[1] || match[3] || match[5]);
		const total = parseFloat(match[2] || match[4] || match[6]);
		const result = (percent / 100) * total;
		return `${percent}% of ${total} = ${result.toFixed(2)}`;
	}

	// Factorial
	match = lowerQuery.match(/([\d]+)!|factorial\s+of\s+([\d]+)/i);
	if (match) {
		const num = parseInt(match[1] || match[2]);
		if (num > 20) return `Factorial of ${num} is too large to calculate`;
		return `${num}! = ${mathFunctions.factorial(num)}`;
	}

	// Average
	match = lowerQuery.match(/average\s+of\s+([\d\s,]+)|mean\s+of\s+([\d\s,]+)/i);
	if (match) {
		const numbers = (match[1] || match[2])
			.split(/[,\s]+/)
			.map((n) => parseFloat(n.trim()))
			.filter((n) => !isNaN(n));

		if (numbers.length > 0) {
			const avg = mathFunctions.average(...numbers);
			return `Average of [${numbers.join(", ")}] = ${avg.toFixed(2)}`;
		}
	}

	// Constants
	if (/\bpi\b|\bπ\b/i.test(lowerQuery)) {
		return `π = ${Math.PI.toFixed(6)}`;
	}

	if (/\be\b|euler/i.test(lowerQuery)) {
		return `e = ${Math.E.toFixed(6)}`;
	}

	return null;
}

export function mathPlugin(query: string): string | null {
	try {
		// First check for special functions
		const specialResult = processSpecialFunctions(query);
		if (specialResult) {
			return specialResult;
		}

		// Then try basic expression evaluation
		for (const pattern of mathPatterns) {
			const match = query.match(pattern);
			if (match && match[1]) {
				const expression = match[1].trim();

				// Skip if it's just a single number without operators
				if (
					/^\d+\.?\d*$/.test(expression) &&
					!query.toLowerCase().includes("what is")
				) {
					continue;
				}

				const result = evaluateExpression(expression);
				if (!isNaN(result)) {
					return `${expression} = ${result}`;
				}
			}
		}

		return null;
	} catch (error) {
		return `Sorry, I couldn't evaluate that mathematical expression.${error}`;
	}
}
