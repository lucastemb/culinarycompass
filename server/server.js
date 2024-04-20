const express = require("express");
const https = require("https");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Convert miles to meters for yelp api
const convertMilesToMeters = (miles) => {
  return Math.round(miles * 1609.34);
};

const fetchYelpData = (location, categories, price, radius, callback) => {
  const queryParams = new URLSearchParams({ location });
  if (categories) queryParams.set("categories", categories);
  if (price) queryParams.set("price", price);
  queryParams.set("radius", convertMilesToMeters(radius || 5));

  const options = {
    hostname: "api.yelp.com",
    path: `/v3/businesses/search?${queryParams.toString()}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.YELP_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const parsedData = JSON.parse(data);
        callback(null, parsedData);
      } catch (error) {
        callback(error);
      }
    });
  });

  req.on("error", (error) => callback(error));
  req.end();
};

app.get("/api/search", (req, res) => {
  const { location, price, categories, radius } = req.query;

  fetchYelpData(location, categories, price, radius, (err, data) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to fetch data",
        details: err.message,
      });
    }
    res.json(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
