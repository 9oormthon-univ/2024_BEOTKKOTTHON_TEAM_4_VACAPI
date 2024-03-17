import { CodefResponse } from './response'

interface CodefResVacccine {
  resEpidemicType: string
  resEpidemicNm: string
  resVaccineNm: string
  resInoculationOrder: string
  resDetailList: CodefResDetail[]
}

interface CodefResDetail {
  resVaccinationNm: string
  resInoculationOrder: string
  resInoculationDate: string
  resInoculationAgency: string
  resVaccineNm: string
  commBrandName: string
  resLOTNumber: string
}

class CodefMyVaccinationData {
  resUserNm!: string
  resUserIdentiyNo!: string
  resVaccineList!: CodefResVacccine[]
}

export class CodefMyVaccinationResponse extends CodefResponse<CodefMyVaccinationData> {
}
