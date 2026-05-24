import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { envs } from "../utils/env";

export interface TokenPayload{
    userId: string
}

export function createToken(tokenayload: TokenPayload){
    return jwt.sign(tokenayload,envs.jwt_secret,{expiresIn:'7d'});
}

export function requireAuth(req: Request,res:Response,next: NextFunction){
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer') ? authHeader.slice(7): undefined;
    if (!token) {
       return res.status(401).json({
            message: 'Authh'
        })
    }
    try {
        const payload = jwt.verify(token!,envs.jwt_secret) as TokenPayload;
        req.userId = payload.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid auth token" });
    }
}