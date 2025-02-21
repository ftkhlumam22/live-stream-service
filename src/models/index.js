const Sequelize = require("sequelize");
const sequelize = require("../tools/sql/sql");

//Import Model

const models = {};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    models[modelName].associate(models);
  }
});

module.exports = {
  ...models,
  sequelize,
};
