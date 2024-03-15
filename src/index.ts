import {sendSlackMessage} from "./util/slack";

const serverless = require("serverless-http");
const express = require("express");
const app = express();


app.get("/", async (req, res, next) => {
    sendSlackMessage("Hello, World!")
});


module.exports.handler = serverless(app);
