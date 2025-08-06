import mongoose, { Schema, Document, Model } from "mongoose";

// ConversationMessage interface
interface ConversationMessage {
	question: string;
	content: string;
	timestamp: string;
	pluginResult?: string;
}

// Mongoose document interface
interface ConversationDoc extends Document {
	sessionId: string;
	messages: ConversationMessage[];
	lastUpdated: Date;
	createdAt: Date;
}

// In-memory cache for recent conversations
class ConversationCache {
	private cache: Map<string, ConversationMessage[]> = new Map();
	private readonly maxCacheItems: number = 20; // Max number of sessions to cache

	// Store messages for a session
	set(sessionId: string, messages: ConversationMessage[]): void {
		// Implement LRU cache eviction if needed
		if (this.cache.size >= this.maxCacheItems) {
			// Remove oldest entry (first item in map)
			const oldestKey = this.cache.keys().next().value;
			if (typeof oldestKey === "string") {
				this.cache.delete(oldestKey);
			}
		}

		this.cache.set(sessionId, [...messages]);
	}

	// Retrieve messages for a session
	get(sessionId: string): ConversationMessage[] | undefined {
		return this.cache.get(sessionId);
	}

	// Check if session exists in cache
	has(sessionId: string): boolean {
		return this.cache.has(sessionId);
	}

	// Add a single message to a session
	addMessage(sessionId: string, message: ConversationMessage): void {
		const messages = this.cache.get(sessionId) || [];

		// Keep only the last 10 messages
		if (messages.length >= 10) {
			messages.shift(); // Remove oldest message
		}

		messages.push(message);
		this.cache.set(sessionId, messages);
	}

	// Clear a session from cache
	clearSession(sessionId: string): boolean {
		return this.cache.delete(sessionId);
	}

	// Get the last N messages for a session
	getLastMessages(
		sessionId: string,
		count: number = 10
	): ConversationMessage[] {
		const messages = this.cache.get(sessionId) || [];
		return messages.slice(-count);
	}
}

// Simple schema definition
const conversationMessageSchema = new Schema<ConversationMessage>(
	{
		question: { type: String, required: true },
		content: { type: String, required: true },
		timestamp: { type: String, required: true },
		pluginResult: { type: String, required: false },
	},
	{ _id: false }
);

const conversationSchema = new Schema<ConversationDoc>({
	sessionId: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	messages: [conversationMessageSchema],
	lastUpdated: {
		type: Date,
		default: Date.now,
		index: { expireAfterSeconds: 1800 }, // TTL index for 30 minutes
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Middleware to keep only last 20 messages
conversationSchema.pre("save", function (next) {
	if (this.messages && this.messages.length > 20) {
		this.messages = this.messages.slice(-20);
	}
	this.lastUpdated = new Date();
	next();
});

// Create the model
const ConversationModel: Model<ConversationDoc> =
	mongoose.models.Conversation ||
	mongoose.model<ConversationDoc>("Conversation", conversationSchema);

class MongoConversationStore {
	private isConnected: boolean = false;
	private conversationCache: ConversationCache = new ConversationCache();

	async connect(): Promise<void> {
		if (this.isConnected && mongoose.connection.readyState === 1) {
			return;
		}

		try {
			const mongoUrl = process.env.MONGODB_URL;

			if (!mongoUrl) {
				throw new Error("MONGODB_URL not found in environment variables");
			}

			console.log("Connecting to MongoDB Atlas...");

			await mongoose.connect(mongoUrl);

			this.isConnected = true;
			console.log("✅ Connected to MongoDB Atlas successfully");
		} catch (error) {
			console.error("❌ MongoDB connection failed:", error);
			this.isConnected = false;
			throw error;
		}
	}

	async addMessage(
		sessionId: string,
		question: string,
		response: string,
		pluginResult?: string
	): Promise<void> {
		const message: ConversationMessage = {
			question,
			content: response,
			timestamp: new Date().toISOString(),
			...(pluginResult && { pluginResult }),
		};

		// Update the in-memory cache first
		this.conversationCache.addMessage(sessionId, message);

		// Then persist to database
		await this.connect();

		try {
			await ConversationModel.findOneAndUpdate(
				{ sessionId },
				{
					$push: {
						messages: {
							$each: [message],
							$slice: -20, // Keep only last 20 messages
						},
					},
					$set: { lastUpdated: new Date() },
					$setOnInsert: { createdAt: new Date() },
				},
				{ upsert: true, new: true }
			);
		} catch (error) {
			console.error("❌ Error adding message:", error);
			throw error;
		}
	}

	async getSystemPromptContext(sessionId: string): Promise<string> {
		// First check if we have this session in cache
		if (this.conversationCache.has(sessionId)) {
			console.log("📋 Using cached conversation for session:", sessionId);
			const cachedMessages = this.conversationCache.getLastMessages(
				sessionId,
				2
			);

			if (cachedMessages.length > 0) {
				const context = cachedMessages
					.map((msg) => `Q: ${msg.question}\nA: ${msg.content}`)
					.join("\n\n");

				return `Previous conversation:${context} Continue naturally.`;
			}
		}

		// If not in cache, fetch from database
		console.log(
			"🔍 Fetching conversation from database for session:",
			sessionId
		);
		await this.connect();

		try {
			const conversation = await ConversationModel.findOne({ sessionId });

			if (!conversation || !conversation.messages.length) {
				return "";
			}

			const lastMessages = conversation.messages.slice(-2);

			// Update the cache with all messages from this conversation
			this.conversationCache.set(sessionId, conversation.messages);

			const context = lastMessages
				.map((msg) => `Q: ${msg.question}\nA: ${msg.content}`)
				.join("\n\n");

			return `Previous conversation:${context} Continue naturally.`;
		} catch (error) {
			console.error("❌ Error getting context:", error);
			return "";
		}
	}

	async clearSession(sessionId: string): Promise<boolean> {
		// Clear from cache
		this.conversationCache.clearSession(sessionId);

		// Clear from database
		await this.connect();

		try {
			const result = await ConversationModel.deleteOne({ sessionId });
			return result.deletedCount > 0;
		} catch (error) {
			console.error("❌ Error clearing session:", error);
			return false;
		}
	}

	async disconnect(): Promise<void> {
		if (this.isConnected) {
			await mongoose.connection.close();
			this.isConnected = false;
			console.log("MongoDB connection closed");
		}
	}
}

// Create singleton instance
export const mongoConversationStore = new MongoConversationStore();

// Enhanced graceful shutdown for Atlas
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
	if (isShuttingDown) return;
	isShuttingDown = true;

	console.log(`🛑 Received ${signal}, shutting down gracefully...`);

	try {
		await mongoConversationStore.disconnect();
		console.log("✅ Graceful shutdown completed");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error during shutdown:", error);
		process.exit(1);
	}
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Export types
export type { ConversationMessage, ConversationDoc };
