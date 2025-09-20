const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

// Load properties dataset
const properties = JSON.parse(fs.readFileSync("properties.json", "utf8"));

app.post("/webhook", (req, res) => {
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const params = req.body.sessionInfo?.parameters || {};
  const location = params.location || null;
  const bhk = params.bhk_config || null;
  const budget = params.budget ? parseInt(params.budget) : null;
  const type = params.property_type || null;
  const amenity = params.amenity || null;

  // Filter dataset
  let results = properties;

  if (location) results = results.filter(p => p.location.toLowerCase() === location.toLowerCase());
  if (bhk) results = results.filter(p => p.bhk_config.toLowerCase() === bhk.toLowerCase());
  if (budget) results = results.filter(p => p.budget <= budget);
  if (type) results = results.filter(p => p.property_type.toLowerCase() === type.toLowerCase());
  if (amenity) results = results.filter(p => p.amenities.includes(amenity.toLowerCase()));

  let responseText = "";

  if (results.length > 0) {
    responseText = "Here are some options:\n";
    results.slice(0, 3).forEach(p => {
      responseText += `🏠 ${p.name} in ${p.location} — ${p.bhk_config}, ${p.property_type}, ₹${p.budget} lakhs.\n`;
    });
  } else {
    responseText = "Sorry, I couldn’t find matching properties. Try changing filters.";
  }

  return res.json({
    fulfillment_response: {
      messages: [
        {
          text: { text: [responseText] }
        }
      ]
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Webhook listening on port ${PORT}`);
});
