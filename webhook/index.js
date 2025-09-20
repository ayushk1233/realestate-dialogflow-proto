const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Webhook endpoint
app.post("/webhook", (req, res) => {
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  // Extract parameters from CX request
  const sessionInfo = req.body.sessionInfo || {};
  const params = sessionInfo.parameters || {};

  const location = params.location || "not provided";
  const bhk = params.bhk_config || "not specified";
  const budget = params.budget || "any budget";
  const type = params.property_type || "any type";

  // Response back to CX
  return res.json({
    fulfillment_response: {
      messages: [
        {
          text: {
            text: [
              `🔎 Searching properties in ${location} — ${bhk}, ${type}, budget: ${budget}.`
            ]
          }
        }
      ]
    }
  });
});

// Render expects a dynamic port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Webhook listening on port ${PORT}`);
});
