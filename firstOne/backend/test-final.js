require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    console.log("🚀 Testing Gemini 2.5-flash...");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(
      "Explain React Native in simple words"
    );

    const response = await result.response;

    console.log("✅ SUCCESS:");
    console.log(response.text());

  } catch (error) {
    console.error("❌ ERROR:");
    console.error(error);
  }
}

test();
