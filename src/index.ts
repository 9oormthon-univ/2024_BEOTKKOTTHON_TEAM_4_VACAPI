import {sendSlackMessage} from "./util/slack";
import * as bodyParser from "body-parser";
import {CodefService} from "./codef";
import {CredentialManager} from "./credential";
import express, {NextFunction, Request, Response} from "express";

import serverless from "serverless-http";
import {validateBody} from "./util/validate";
import {MyVaccinationRequest} from "./dto/my-vaccination";
import {DomainException} from "./exceptions/DomainException";
import {ErrorResponse} from "./dto/error";
import {ResetPasswordRequest} from "./dto/reset-password/reset-password";
import {CodefSecureNoResponse} from "./dto/codef/change-password";
import {BaseResponse} from "./dto/response";
import {SecureNoResponse} from "./dto/reset-password/secure-no";

require("express-async-errors")


const app = express();

app.use(bodyParser.json());
//app.use(verifyToken);

app.get("/test", (req, res) => {
    throw Error("의도적인에러")
})

app.post("/vaccination", validateBody(MyVaccinationRequest),
    async (req: Request & {
        body: MyVaccinationRequest
    }, res: Response) => {
        const dto = req.body

        const credentialManager = new CredentialManager()
        const credential = await credentialManager.getCredential()
        const codefService = new CodefService(credential)

        const result = await codefService.getMyVaccinationRecords(dto.id, dto.password)
        res.json(result)
    });


app.post("/reset-password", validateBody(ResetPasswordRequest),
    async (req: Request & { body: ResetPasswordRequest }, res: Response) => {
        const dto = req.body

        console.log(dto)
        const credentialManager = new CredentialManager()
        const credential = await credentialManager.getCredential()
        const codefService = new CodefService(credential)

        const response = await codefService.requestResetPassword(dto)
        if (response instanceof CodefSecureNoResponse) {
            res.json(
                new BaseResponse<SecureNoResponse>(true, "보안 코드를 입력해주세요.", {
                    secureNoImage: response.data.extraInfo.reqSecureNo,
                    validUntil: response.data.twoWayTimestamp + 170,
                    type: "SECURE_NO"
                })
            )
        }
    }
)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(err, err instanceof DomainException)
    if (err instanceof DomainException) {
        res.status(400).json(
            new ErrorResponse(
                err.errorData.message,
                err.errorData.code,
                err.data
            )
        )
    } else {
        sendSlackMessage(err.message)
        res.status(500).json(
            new ErrorResponse(
                "서버 에러",
                "SERVER_ERROR"
            )
        )
        next();
    }
})


module.exports.handler = serverless(app);
