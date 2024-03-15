const serverless = require("serverless-http");
const express = require("express");
const app = express();


app.get("/", async (req, res, next) => {
});


module.exports.handler = serverless(app);
