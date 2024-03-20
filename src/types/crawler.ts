export interface VaccineResponseDetail {
  patorgnam: string
  vcnNm: string
  vcndte: string
  lotnum: string
  vcntmenam: string
  vacnam: string
  mannam: string
}

export interface VaccineResponse {
  ptntInfoVcnDtl: VaccineResponseDetail[]
}
