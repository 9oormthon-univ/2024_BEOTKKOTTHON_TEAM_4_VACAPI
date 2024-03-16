import {IsEnum, IsNotEmpty, IsNumberString, IsString, Length} from "class-validator";

export enum Telecom {
    SKT = 0,
    KT,
    LG,
    SKT_MVNO,
    KT_MVNO,
    LG_MVNO
}

export type ChallengeType = "SECURE_NO" | "SMS";

export class ResetPasswordRequest {
    @IsString()
    @IsNotEmpty()
    userName!: string;

    @IsNotEmpty()
    @IsNumberString()
    @Length(9, 9)
    identity!: string;

    @IsString()
    @IsNotEmpty()
    @Length(9, 20)
    newPassword!: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(Telecom)
    telecom!: Telecom;

    @IsNumberString()
    @IsNotEmpty()
    @Length(11, 11)
    phoneNumber!: string;
}

export class ResetPasswordResponse<T> {
    type!: ChallengeType;
    data!: T;
}


