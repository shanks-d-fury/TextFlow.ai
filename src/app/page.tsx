"use client";

import React, { useState } from "react";
import "./page.css";

export default function Home() {
	// Track which button was copied
	const [copiedType, setCopiedType] = useState<string | null>(null);

	const jsonExample = `{
  "message": "Your question or request here",
  "session_id": "unique-session-identifier"
}`;
	const curlExample = `curl -X POST http://text-flow-ai.vercel.app/api/agent/message \
  
    -H 'Content-Type: application/json' \
	
    -d '{
    "message": "what technologies are used to build the blog?",
    "session_id": "user111"
  }'`;

	const copyToClipboard = (type: string) => {
		let resultType: string = "";
		if (type.match("curl")) {
			resultType += curlExample;
		} else {
			resultType += jsonExample;
		}
		navigator.clipboard
			.writeText(resultType)
			.then(() => {
				setCopiedType(type);
				setTimeout(() => setCopiedType(null), 2000); // Reset after 2 seconds
			})
			.catch((err) => {
				console.error("Failed to copy: ", err);
			});
	};

	return (
		<div className="container">
			<header>
				<h1>Text_Flow.AI</h1>
				<p className="subtitle">
					A conversational AI agent with plugin support and RAG capabilities
				</p>
			</header>

			<section className="api-instructions">
				<h2>API Usage</h2>

				<div className="code-container">
					<p>
						Send POST requests to <code>/api/agent/message</code> with the
						following JSON payload:
					</p>
					<pre className="json-button">
						<small>{jsonExample}</small>
						<button
							className="copy-button"
							onClick={() => copyToClipboard("json")}
							aria-label="Copy to clipboard"
							type="button"
						>
							{copiedType === "json" ? (
								<span className="copied-text">Copied!</span>
							) : (
								<i className="fa-solid fa-file-code"></i>
							)}
						</button>
					</pre>
					<p>or use this cURL command </p>
					<pre className="json-button">
						<small className="curlExample">{curlExample}</small>
						<button
							className="copy-button"
							onClick={() => copyToClipboard("curl")}
							aria-label="Copy to clipboard"
							type="button"
						>
							{copiedType === "curl" ? (
								<span className="copied-text">Copied!</span>
							) : (
								<i className="fa-solid fa-file-code"></i>
							)}
						</button>
					</pre>
				</div>

				<h3>Available Features</h3>
				<ul>
					<li>
						Conversational memory with session tracking & automatic memory clean
						up (<b>TTL Index</b> in MongoDB)
					</li>
					<li>Context-aware responses using RAG</li>
					<li>Plugin support for weather, math, and calendar information</li>
				</ul>
			</section>

			<footer>
				<p>© {new Date().getFullYear()} Text Flow AI</p>
			</footer>
		</div>
	);
}
