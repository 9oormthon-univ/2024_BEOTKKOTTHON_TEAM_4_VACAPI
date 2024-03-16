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
import {
    ChallengeRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    Telecom
} from "./dto/reset-password/reset-password";
import {BaseResponse} from "./dto/response";
import {SecureNoResponse} from "./dto/reset-password/secure-no";
import {RequestToken} from "./types/token";
import {RequestTokenRepository} from "./request-token-repository";
import {ErrorCode} from "./types/error";
import {SmsResponse} from "./dto/reset-password/sms";
import {verifyToken} from "./util/auth";
import jwt from "jsonwebtoken";

require("express-async-errors")


const app = express();

app.use(bodyParser.json());
app.use("/vaccination", verifyToken);
app.use("/reset-password/*", verifyToken);

app.get("/", (req, res) => {
    res.send("VACAPI 💉🐻‍❄️")
})

app.get("/token", (req, res) => {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined")

    const userId = "testuser"
    res.send(jwt.sign({subject: userId}, process.env.JWT_SECRET))
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


app.post("/reset-password/challenge", validateBody(ChallengeRequest),
    async (req: Request & {
        body: ChallengeRequest
    }, res: Response) => {
        const dto: ChallengeRequest = req.body
        const requestTokenRepository = new RequestTokenRepository()

        const userId = req.userId
        if (!userId) throw new DomainException(ErrorCode.AUTH_MISSING)

        const token = await requestTokenRepository.getToken(userId)
        if (!token) throw new DomainException(ErrorCode.CHALLENGE_NOT_FOUND)

        const credentialManager = new CredentialManager()
        const credential = await credentialManager.getCredential()
        const codefService = new CodefService(credential)

        if (dto.type === "SMS") {
            console.log(token)
            if (!token.secureNo) throw new DomainException(ErrorCode.NO_CHALLENGE_SECURE_CODE)
            const response = await codefService.challengeSMS(token, dto)

            res.json(new BaseResponse<ResetPasswordResponse>(
                true,
                "비밀번호 변경 완료",
                {
                    userId: response.data.resLoginId
                }
            ))

        } else if (dto.type === "SECURE_NO") {
            const response = await codefService.challengeSecureNo(token, dto)

            await requestTokenRepository.saveToken(
                {
                    ...token,
                    secureNo: dto.code
                }
            )

            res.json(
                new BaseResponse<SmsResponse>(
                    true,
                    "요청이 완료되었습니다.",
                    {
                        type: "SMS",
                        validUntil: token.expireAt
                    }
                )
            )
        }

    })

app.post("/reset-password", validateBody(ResetPasswordRequest),
    async (req: Request & { body: ResetPasswordRequest }, res: Response) => {
        const userId = req.userId
        if (!userId) throw new DomainException(ErrorCode.AUTH_MISSING)
        
        const dto: ResetPasswordRequest = req.body

        const requestTokenRepository = new RequestTokenRepository()

        const credentialManager = new CredentialManager()
        const credential = await credentialManager.getCredential()
        const codefService = new CodefService(credential)

        const response = await codefService.requestResetPassword(dto)

        const token: RequestToken = {
            userId: userId,
            jobIndex: response.data.jobIndex,
            threadIndex: response.data.threadIndex,
            jti: response.data.jti,
            twoWayTimestamp: response.data.twoWayTimestamp,
            expireAt: response.data.twoWayTimestamp + 170,
            userName: dto.userName,
            identity: dto.identity,
            newPassword: codefService.encryptPassword(dto.newPassword),
            telecom: Telecom[dto.telecom].toString(),
            phoneNumber: dto.phoneNumber,
        }

        await requestTokenRepository.saveToken(token)

        res.json(
            new BaseResponse<SecureNoResponse>(true, "보안 코드를 입력해주세요.", {
                secureNoImage: response.data.extraInfo.reqSecureNo,
                validUntil: response.data.twoWayTimestamp + 170,
                type: "SECURE_NO"
            })
        )
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
