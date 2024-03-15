import {IsNotEmpty, IsString} from "class-validator";

export class MyVaccinationRequest {
    @IsString()
    @IsNotEmpty()
    id!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}
