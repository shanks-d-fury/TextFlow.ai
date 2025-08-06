"use client";

import React from "react";
import "./page.css";
export default function Home() {
	return (
		<div className="container">
			<header>
				<h1>Text Flow AI API</h1>
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

				<pre>
					{`{
  "message": "Your question or request here",
  "session_id": "unique-session-identifier"
}`}
				</pre>

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
