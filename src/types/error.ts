export interface ErrorData {
  code: string
  message: string
  success: boolean
}

export const ErrorCode = {
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: '요청을 확인해주세요.',
    success: false
  },
  ID_NOT_FOUND: {
    code: 'ID_NOT_FOUND',
    message: '예방접종도우미 ID를 찾을 수 없습니다.',
    success: false
  },
  PASSWORD_ERROR: {
    code: 'PASSWORD_ERROR',
    message: '예방접종도우미 비밀번호가 틀렸습니다.',
    success: false
  },
  AUTH_MISSING: {
    code: 'AUTH_MISSING',
    message: 'Auth 토큰이 필요합니다.',
    success: false
  },
  INVALID_AUTH: {
    code: 'INVALID_AUTH',
    message: '올바르지 않은 Auth 토큰입니다.',
    success: false
  },
  NO_CHALLENGE_SECURE_CODE: {
    code: 'NO_CHALLENGE_SECURE_CODE',
    message: '보안 코드 단계를 먼저 시행하세요.',
    success: false
  },
  CHALLENGE_NOT_FOUND: {
    code: 'CHALLENGE_NOT_FOUND',
    message: '인증 절차를 다시 시도해주세요.',
    success: false
  },
  CODEF_ERROR: {
    code: 'CODEF_ERROR',
    message: 'CODEF 서비스에서 에러가 발생했습니다.',
    success: false
  },
  SMS_ERROR: {
    code: 'SMS_ERROR',
    message: '인증번호가 일치하지 않습니다.',
    success: false
  },
  SECURE_NO_ERROR: {
    code: 'SECURE_NO_ERROR',
    message: '보안 코드가 일치하지 않습니다.',
    success: false
  },
  PHONE_VERIFICATION_LOCK: {
    code: 'PHONE_VERIFICATION_LOCK',
    message: '일일 인증 횟수를 초과하여 잠금 해제가 필요합니다.',
    success: false
  },
  REGISTER_FIRST: {
    code: 'REGISTER_FIRST',
    message: '예방접종도우미에 먼저 가입해주세요.',
    success: false
  },
  USER_ALREADY_REGISTERED: {
    code: 'USER_ALREADY_REGISTERED',
    message: '예방접종도우미에 이미 가입되어 있습니다.',
    success: true
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: '만료된 JWT Token',
    success: false
  },
  RRN_REQUIRED: {
    code: 'RRN_REQUIRED',
    message: '주민등록번호 등록이 필요합니다.',
    success: false
  },
  RNN_REGISTER_FAILED: {
    code: 'RNN_REGISTER_FAILED',
    message: '주민등록번호 등록에 실패했습니다. 다시 로그인을 시도해주세요.',
    success: false
  },
  RETRY_SECURE_NO: {
    code: 'RETRY_SECURE_NO',
    message: '보안문자를 다시 입력해주세요.',
    success: false
  },
  RETRY_SMS: {
    code: 'RETRY_SMS',
    message: '인증번호를 다시 입력해주세요.',
    success: false
  },
  INVALID_AUTH_INFO: {
    code: 'INVALID_AUTH_INFO',
    message: '입력한 정보가 유효하지 않습니다.',
    success: false
  },
  NOT_NIP_MEMBER: {
    code: 'NOT_NIP_MEMBER',
    message: '예방접종도우미 회원이 아닙니다.',
    success: false
  },
  NIP_ERROR: {
    code: 'NIP_ERROR',
    message: '예방접종도우미 서비스에서 에러가 발생했습니다.',
    success: false
  },
  PASSWORD_5_ERROR: {
    code: 'PASSWORD_5_ERROR',
    message: '비밀번호 오류 5회 초과로 비밀번호 찾기가 필요합니다',
    success: false
  }
}
