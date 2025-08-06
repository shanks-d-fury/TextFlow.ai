"use client";

import React, { useState } from "react";
import "./page.css";

export default function Home() {
	const [copied, setCopied] = useState(false);
	const jsonExample = `{
  "message": "Your question or request here",
  "session_id": "unique-session-identifier"
}`;

	const copyToClipboard = () => {
		navigator.clipboard
			.writeText(jsonExample)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
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
				<p>
					Send POST requests to <code>/api/agent/message</code> with the
					following JSON payload:
				</p>

				<div className="code-container">
					<pre className="json-button">
						{jsonExample}
						<button
							className="copy-button"
							onClick={copyToClipboard}
							aria-label="Copy to clipboard"
							type="button"
						>
							{copied ? (
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
