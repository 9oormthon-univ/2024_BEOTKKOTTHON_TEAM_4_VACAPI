import { IsNotEmpty, IsString } from 'class-validator'
import { type CodefMyVaccinationResponse } from './codef/my-vaccination'
import { formatDate, parseIdentity } from './common/identity'

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
  inoculationOrder!: number
  inoculationOrderString!: string
  date!: string
  agency!: string
  vaccineName?: string
  vaccineBrandName?: string
  lotNumber?: string
}

export class MyVaccinationResponse {
  name!: string
  birth!: string
  sex!: string
  vaccineList!: VaccineData[]

  static fromCodefResponse (response: CodefMyVaccinationResponse): MyVaccinationResponse {
    const userIdentity = parseIdentity(response.data.resUserIdentiyNo)

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
              inoculationOrder: parseInt(vaccine.resInoculationOrder),
              inoculationOrderString: detail.resInoculationOrder,
              date: formatDate(detail.resInoculationDate),
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
      birth: userIdentity.date,
      sex: userIdentity.sex,
      vaccineList: vaccinations
    }
  }
}
