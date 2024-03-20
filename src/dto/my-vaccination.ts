import { IsNotEmpty, IsString } from 'class-validator'
import { type CodefMyVaccinationResponse } from './codef/my-vaccination'

export class MyVaccinationRequest {
  @IsString()
  @IsNotEmpty()
    id!: string

  @IsString()
  @IsNotEmpty()
    password!: string
}

export class DetailData {
  vaccinationName!: string
  inoculationOrder!: string
  inoculationDate!: string
  inoculationAgency!: string
  vaccineName!: string
  commBrandName!: string
  lotNumber!: string
}

export class VaccineData {
  vaccineType!: string
  order!: number
  orderString!: string
  date!: number
  agency!: string
  vaccineName!: string
  vaccineBrandName!: string
  lotNumber!: string
}

export class MyVaccinationResponse {
  name!: string
  birth!: string
  sex!: string
  vaccineList!: VaccineData[]

  static fromCodefResponse (response: CodefMyVaccinationResponse): MyVaccinationResponse {
    const sexIdentityNo = response.data.resUserIdentiyNo.slice(7, 8)
    const sex = sexIdentityNo === '1' || sexIdentityNo === '3' ? 'M' : 'F'

    const vaccinations = response.data.resVaccineList.filter(
      (vaccine) => {
        return vaccine.resDetailList.length > 0
      }
    ).flatMap(
      (vaccine) => {
        return vaccine.resDetailList.map(
          (detail): VaccineData => {
            return {
              vaccineType: vaccine.resVaccineNm,
              order: parseInt(vaccine.resInoculationOrder),
              orderString: detail.resInoculationOrder,
              date: parseInt(detail.resInoculationDate),
              agency: detail.resInoculationAgency,
              vaccineName: detail.resVaccineNm,
              vaccineBrandName: detail.commBrandName,
              lotNumber: detail.resLOTNumber
            }
          }
        )
      }
    )

    return {
      name: response.data.resUserNm,
      birth: response.data.resUserIdentiyNo.slice(0, 6),
      sex,
      vaccineList: vaccinations
    }
  }
}
