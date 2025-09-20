const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

// Load properties dataset
const properties = JSON.parse(fs.readFileSync("properties.json", "utf8"));

// 🔹 Helper to normalize budget values like "80 lakhs", "1 crore"
function normalizeBudget(value) {
  if (!value) return null;
  let str = value.toString().toLowerCase();

  if (str.includes("crore")) {
    let num = parseInt(str);
    return num * 100; // 1 crore = 100 lakhs
  } else if (str.includes("lakh")) {
    return parseInt(str);
  } else if (str.includes("cr")) {
    let num = parseInt(str);
    return num * 100;
  } else {
    return parseInt(str); // fallback (just number)
  }
}

app.post("/webhook", (req, res) => {
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const params = req.body.sessionInfo?.parameters || {};
  let { location, bhk_config, budget, property_type, amenity } = params;

  // Normalize budget
  budget = normalizeBudget(budget);

  // Filter dataset
  let results = properties;

  if (location) {
    results = results.filter(
      (p) => p.location.toLowerCase() === location.toLowerCase()
    );
  }

  if (bhk_config) {
    results = results.filter(
      (p) => p.bhk_config.toLowerCase() === bhk_config.toLowerCase()
    );
  }

  if (budget) {
    results = results.filter((p) => p.budget <= budget);
  }

  if (property_type) {
    let pt = property_type.toLowerCase().replace(/s$/, ""); // singularize "flats" → "flat"
    results = results.filter((p) =>
      p.property_type.toLowerCase().includes(pt)
    );
  }

  if (amenity) {
    results = results.filter((p) =>
      p.amenities.map((a) => a.toLowerCase()).includes(amenity.toLowerCase())
    );
  }

  // Prepare response
  let responseText = "";

  if (results.length > 0) {
    responseText = "Here are some options:\n\n";
    results.slice(0, 3).forEach((p) => {
      responseText += `🏠 ${p.name} in ${p.location} — ${p.bhk_config}, ${p.property_type}, ₹${p.budget} lakhs.\n`;
    });
  } else {
    responseText =
      "❌ I couldn’t find exact matches. Try increasing budget or removing filters.";
  }

  // Send back to Dialogflow
  return res.json({
    fulfillment_response: {
      messages: [
        {
          text: {
            text: [responseText],
          },
        },
      ],
    },
  });
});

// Health check route for browser
app.get("/", (req, res) => {
  res.send("✅ RealEstate Webhook is running!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Webhook listening on port ${PORT}`);
});
