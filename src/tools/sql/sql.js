const { Sequelize } = require("sequelize");
const { CONFIG } = require("../../config/config");

const { USERNAME, PASSWORD, HOST, NAME } = CONFIG.DATABASE;

const sequelize = new Sequelize(NAME, USERNAME, PASSWORD, {
  host: HOST,
  dialect: "mysql",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("\nDATABASE ::::>>>> CONNECTED \n");
  } catch (error) {
    console.error("ERROR DATABASE :::::: ", error);
  }
})();

module.exports = sequelize;
