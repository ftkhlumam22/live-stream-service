const route = require("express").Router();

const liveRouter = require("./live/liveRouter");

route.use("/live", liveRouter);

module.exports = route;
