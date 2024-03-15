import {validate} from "class-validator";
import {plainToInstance} from "class-transformer";
import {NextFunction, Request, Response} from "express";
import {MyVaccinationRequest} from "../dto/my-vaccination";
import {ErrorResponse} from "../dto/error";
import {ErrorCode} from "../types/error";

export function validateBody(schema: { new(): any }) {
    return async function (req: Request, res: Response, next: NextFunction) {
        const dto = plainToInstance(MyVaccinationRequest, req.body)

        const errors = await validate(dto, {
            whitelist: true,
            forbidNonWhitelisted: true,
            skipMissingProperties: false,
        });

        if (errors.length > 0) {
            return res.status(400).json(
                new ErrorResponse("요청을 확인해주세요!",
                    ErrorCode.VALIDATION_ERROR,
                    errors.map((e) => e.property)
                )
            )
        }

        req.body = dto
        next();
    };
}
