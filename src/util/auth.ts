import { type NextFunction, type Request, type Response } from 'express'
import { DomainException } from '../exceptions/DomainException'
import { ErrorCode } from '../types/error'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string
  exp: number
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (token == null) throw new DomainException(ErrorCode.AUTH_MISSING)
  if (process.env.JWT_SECRET == null) throw new Error('JWT_SECRET is not defined')

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err != null) throw new DomainException(ErrorCode.INVALID_AUTH)
    const payload = user as JwtPayload

    req.userId = payload.sub
    next()
  })
}
