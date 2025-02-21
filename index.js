const server = require("./src/server");
const { CONFIG } = require("./src/config/config");

const { PORT } = CONFIG;

require("dotenv").config();

server.listen(PORT, () => {
  console.log("\n:::::::AUTH||MODULE:::::::");
  console.log("\nSERVER RUNNING ON ::::: " + PORT + "\n");
});

module.exports = server;
