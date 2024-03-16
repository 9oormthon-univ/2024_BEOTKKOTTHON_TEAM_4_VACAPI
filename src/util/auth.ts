import {NextFunction, Request, Response} from "express";
import {DomainException} from "../exceptions/DomainException";
import {ErrorCode} from "../types/error";
import jwt from "jsonwebtoken";

export type JwtPayload = {
    sub: string;
    exp: number;
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) throw new DomainException(ErrorCode.AUTH_MISSING)

    jwt.verify(token, process.env.JWT_SECRET || '', (err, user) => {
        if (err) throw new DomainException(ErrorCode.INVALID_AUTH)
        const payload = user as JwtPayload

        req.userId = payload.sub
        next()
    })
}
