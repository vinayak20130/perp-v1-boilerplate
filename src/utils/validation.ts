import type { Request, Response } from "express";
import type { ZodError } from "zod";

export const sendValidationError = (res: Response, error: ZodError) =>{
    res.status(400).json({
        error : 'validation error',
        issues : error.issues.map((issue) =>({
            issue: issue.path.join("."),
            message: issue.message
        }))
    })
}

