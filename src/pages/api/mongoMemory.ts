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
	},
	messages: [conversationMessageSchema],
	lastUpdated: {
		type: Date,
		default: Date.now,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// Create the model
const ConversationModel: Model<ConversationDoc> =
	mongoose.models.Conversation ||
	mongoose.model<ConversationDoc>("Conversation", conversationSchema);

class MongoConversationStore {
	private isConnected: boolean = false;

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
		await this.connect();

		const message: ConversationMessage = {
			question,
			content: response,
			timestamp: new Date().toISOString(),
			...(pluginResult && { pluginResult }),
		};

		try {
			await ConversationModel.findOneAndUpdate(
				{ sessionId },
				{
					$push: { messages: message },
					$set: { lastUpdated: new Date() },
				},
				{ upsert: true, new: true }
			);
		} catch (error) {
			console.error("❌ Error adding message:", error);
			throw error;
		}
	}

	async getSystemPromptContext(sessionId: string): Promise<string> {
		await this.connect();

		try {
			const conversation = await ConversationModel.findOne({ sessionId });

			if (!conversation || !conversation.messages.length) {
				return "";
			}

			const lastMessages = conversation.messages.slice(-3);
			const context = lastMessages
				.map((msg) => `Q: ${msg.question}\nA: ${msg.content}`)
				.join("\n\n");

			return `Previous conversation:\n${context}\n\nContinue naturally.`;
		} catch (error) {
			console.error("❌ Error getting context:", error);
			return "";
		}
	}

	async clearSession(sessionId: string): Promise<boolean> {
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

// Export types
export type { ConversationMessage, ConversationDoc };
