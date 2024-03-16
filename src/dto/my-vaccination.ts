import {IsNotEmpty, IsString} from "class-validator";
import {CodefMyVaccinationResponse} from "./codef/my-vaccination";

export class MyVaccinationRequest {
    @IsString()
    @IsNotEmpty()
    id!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}

export class DetailData {
    vaccinationName!: string;
    inoculationOrder!: string;
    inoculationDate!: string;
    inoculationAgency!: string;
    vaccineName!: string;
    commBrandName!: string;
    lotNumber!: string;
}

export class VaccineData {
    epidemicType!: string;
    epidemicName!: string;
    vaccineName!: string;
    inoculationOrder!: string;
    detailList!: DetailData[];
}

export class MyVaccinationResponse {
    name!: string;
    vaccineList!: VaccineData[];

    static fromCodefResponse(response: CodefMyVaccinationResponse): MyVaccinationResponse {
        return {
            name: response.data.resUserNm,
            vaccineList: response.data.resVaccineList.map(
                (vaccine): VaccineData => ({
                        epidemicType: vaccine.resEpidemicType,
                        epidemicName: vaccine.resEpidemicNm,
                        vaccineName: vaccine.resVaccineNm,
                        inoculationOrder: vaccine.resInoculationOrder,
                        detailList: vaccine.resDetailList.map(
                            (detail): DetailData => ({
                                vaccinationName: detail.resVaccinationNm,
                                inoculationOrder: detail.resInoculationOrder,
                                inoculationDate: detail.resInoculationDate,
                                inoculationAgency: detail.resInoculationAgency,
                                vaccineName: detail.resVaccineNm,
                                commBrandName: detail.commBrandName,
                                lotNumber: detail.resLOTNumber
                            })
                        )
                    }
                ))
        }
    }
}
