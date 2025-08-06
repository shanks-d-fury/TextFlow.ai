# Development Notes

## AI-Generated vs Manual Components

### AI-Generated Components

- Basic structural ideas
- MongoDB connection handling code
- Calendar plugin regex patterns
- Vector dimension reduction utility
- Error handling patterns in API routes
- Structuring of the .md files

### Manual Implementation

- Core agent logic and decision flow
- Plugin integration architecture
- Fine-tuning of RAG retrieval logic
- Memory management optimizations
- Security hardening and rate limiting
- Custom UI components and styling
- Caching of last two conversation
- Storing only last 20 conversation of the session

## Bugs Encountered and Solutions

### Issue 1: MongoDB Connection Pooling

- **Problem:** MongoDB connection error and bug in the connection string
- **Solution:** There issue was with the password within the connection string, the mongodb connection string's password had one special charecter

### Issue 2: Vector Dimension Mismatch

**Problem:** Embedding model output dimensions didn't match Pinecone expectations
**Solution:** Created dimension reduction utility

```typescript
export function reduceDimensions(
	vector: number[],
	targetDimension: number = 2048
): number[] {
	return vector.slice(0, targetDimension);
}
```

### Issue 3: Memory Leaks with Long Sessions

**Problem:** Memory usage grew unbounded with long-running sessions
**Solution:** Implemented TTL indexes in MongoDB and LRU cache

```typescript
// MongoDB schema with TTL index
lastUpdated: {
  type: Date,
  default: Date.now,
  index: { expireAfterSeconds: 1800 } // 30 minutes TTL
}
```

## Agent Architecture Details

### Plugin Routing System

The agent uses a two-stage classification system:

1. **Query Classification**: Identifies the intent and routes to the appropriate plugin

   ```typescript
   const queryType = await plugin_llm(message);

   if (queryType === "WEATHER") {
   	// Route to weather plugin
   } else if (queryType === "MATH") {
   	// Route to math plugin
   } else if (queryType === "DATE") {
   	// Route to calendar plugin
   }
   ```

2. **Plugin Execution**: Each plugin has its own specialized logic

   ```typescript
   export async function weatherPlugin(query: string) {
   	// Extract location
   	// Fetch weather data
   	// Format response
   }
   ```

### Memory and Context Integration

The agent builds context from three sources:

1. **Conversation Memory**:

   ```typescript
   const conversationContext =
   	await mongoConversationStore.getSystemPromptContext(session_id);
   ```

2. **RAG Knowledge**:

   ```typescript
   const retrievedContext = await retrieveContextForMessage(message);
   ```

3. **Plugin Results**:

   ```typescript
   const { pluginResult } = await processQuery(message);
   ```

**These are combined into a unified context:**

```typescript
const fullSystemContext = [
	conversationContext || "",
	retrievedContext ? `Relevant information: ${retrievedContext}` : "",
	pluginResult ? `PluginResult: ${pluginResult}` : "",
]
	.filter(Boolean)
	.join("");
```

**Full System context is sent to another ai agent to give a appropriate response**

```typescript
const reply = await agent_llm(message, fullSystemContext);
```

**Response is sent to the user and the question and answers are stored within the database**

```typescript
// Store the question-response pair
await mongoConversationStore.addMessage(
	session_id,
	message,
	reply,
	pluginResult
);

//The response is sent to the user in the JSON format
return NextResponse.json({
	reply,
});
```
