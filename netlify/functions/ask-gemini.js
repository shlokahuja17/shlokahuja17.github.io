const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  try {
    const { question, userName, topic } = JSON.parse(event.body);
    
    if (!question) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Question is required" })
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "API configuration error. Contact support!" })
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const systemPrompt = `You are a friendly, encouraging AI tutor for an 8-10 year old child named ${userName} who loves Chess, Cricket, Coding, Science, and Math. 
    Answer in very simple, fun, and encouraging language using emojis when appropriate. 
    Keep your response under 150 words. 
    ${topic && topic !== 'all' ? `Focus on ${topic}.` : ''}
    Make learning fun and exciting!`;
    
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: question }
          ]
        }
      ]
    });

    const answer = result.response.text() || "Sorry, I couldn't generate a response. Try again!";
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ answer })
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: error.message || "Failed to generate response. Please try again!"
      })
    };
  }
};
