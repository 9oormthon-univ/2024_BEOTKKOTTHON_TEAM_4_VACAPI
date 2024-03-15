import {CredentialManager} from "./credential";

const serverless = require("serverless-http");
const express = require("express");
const app = express();


app.get("/", async (req, res, next) => {
    const credentialManager = new CredentialManager();

    res.json({
        c: await credentialManager.getActiveCredential()
    });
});


app.get("/refresh", async (req, res, next) => {
    const credentialManager = new CredentialManager();

    res.json({
        c: await credentialManager.refreshCredentials()
    });
});


module.exports.handler = serverless(app);
