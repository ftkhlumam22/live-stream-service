const cors = require("cors");
const express = require("express");
const compression = require("compression");
const httpResponse = require("./helper/httpResponse");
const routesApi = require("./routes");
// Initialize Express
const app = express();

// Express Middleware
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

// Compress Data
app.use(compression({ level: 8 }));

// Cors Origin
app.use(cors());

app.use("/", routesApi);

app.use((_, res) => {
  return httpResponse.notFoundResponse(res, "API not found");
});

module.exports = app;
