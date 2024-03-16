export type ErrorData = {
    code: string,
    message: string,
}

export const ErrorCode = {
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "요청을 확인해주세요.",
    },
    ID_NOT_FOUND: {
        code: "ID_NOT_FOUND",
        message: "예방접종도우미 ID를 찾을 수 없습니다.",
    },
    AUTH_MISSING: {
        code: "AUTH_MISSING",
        message: "Auth 토큰이 필요합니다.",
    },
    INVALID_AUTH: {
        code: "INVALID_AUTH",
        message: "올바르지 않은 Auth 토큰입니다.",
    },
}
