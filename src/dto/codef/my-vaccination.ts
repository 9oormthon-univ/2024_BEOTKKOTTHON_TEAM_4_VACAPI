import {CodefResponse} from "./response";

type CodefResVacccine = {
    resEpidemicType: string;
    resEpidemicNm: string;
    resVaccineNm: string;
    resInoculationOrder: string;
    resDetailList: CodefResDetail[];
}

type CodefResDetail = {
    resVaccinationNm: string;
    resInoculationOrder: string;
    resInoculationDate: string;
    resInoculationAgency: string;
    resVaccineNm: string;
    commBrandName: string;
    resLOTNumber: string;
}

class CodefMyVaccinationData {
    resUserNm!: string;
    resUserIdentiyNo!: string;
    resVaccineList!: CodefResVacccine[];
}

export class CodefMyVaccinationResponse extends CodefResponse<CodefMyVaccinationData> {
}
