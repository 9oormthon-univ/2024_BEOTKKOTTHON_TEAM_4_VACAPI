import { CookieJar } from 'tough-cookie'
import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import * as cheerio from 'cheerio'
import { type VaccineData } from './dto/my-vaccination'
import { type VaccineResponse } from './types/crawler'

declare module 'axios' {
  interface AxiosRequestConfig {
    jar?: CookieJar
  }
}

export class Crawler {
  private readonly jar = new CookieJar()
  private readonly axios = axios.create({ jar: this.jar })
  private readonly client = wrapper(this.axios)

  public async isIDAvaliable (id: string): Promise<boolean> {
    try {
      const csrf = await this.retrieveCsrf('https://nip.kdca.go.kr/irhp/goLogin.do')
      const response = await this.client.post(
        'https://nip.kdca.go.kr/irhp/mebr/chkIDExists.json',
        {
          userId: id
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Csrf-Token': csrf
          }
        }
      )

      if (response.data.rtnVal === 'true') return false
      else return true
    } catch (e) {
      console.log(e)
      return true
    }
  }

  public async getHPV (id: string, password: string): Promise<VaccineData[]> {
    try {
      await this.login(id, password)
      const userId = await this.getUserId()
      const response = await Promise.all(
        [1, 2, 3].map(
          async (count) => {
            return await this.getVaccination('2003', count, userId)
          }
        )
      )

      return response.filter((vaccine) => vaccine !== null) as VaccineData[]
    } catch (e) {
      return []
    }
  }

  private async getUserId (): Promise<string> {
    const csrf = await this.retrieveCsrf('https://nip.kdca.go.kr/irhp/mngm/goVcntMngm.do?menuLv=3&menuCd=321')

    const response = await this.client.post<string>(
      'https://nip.kdca.go.kr/irhp/mngm/goPatVaccHist.do',
      {
        menuLv: '3',
        menuCd: '321',
        _csrf: csrf,
        patnum: ''
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const $ = cheerio.load(response.data)

    const vaccines = $('tbody tr a').get()

    const href = vaccines[0].attribs.href

    const regex = /fnOpenPopup\('.*?','(\d+)','(\d+)','(\d+)'/
    const matches = href.match(regex)
    if (matches.length === 0) throw new Error('No matches')

    return matches[1]
  }

  private async getVaccination (code: string, count: number, userId: string): Promise<VaccineData | null> {
    const csrf = await this.retrieveCsrf('https://nip.kdca.go.kr/irhp/mngm/goVcntMngm.do?menuLv=3&menuCd=321')

    const response = await this.client.post<VaccineResponse>(
      'https://nip.kdca.go.kr/irhp/getPtnInfoVcnDtl.json',
      {
        dgmSeq: '',
        patnum: userId,
        vcncd: code,
        vcntme: count
      },
      {
        withCredentials: true,
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Csrf-Token': csrf
        }
      }
    )

    if (response.data.ptntInfoVcnDtl.length === 1) {
      const detail = response.data.ptntInfoVcnDtl[0]
      return {
        vaccineType: detail.vcnNm,
        inoculationOrder: count,
        inoculationOrderString: detail.vcntmenam,
        date: detail.vcndte.replace(/\./g, '-'),
        agency: detail.patorgnam,
        vaccineName: detail.vacnam,
        vaccineBrandName: detail.mannam,
        lotNumber: detail.lotnum
      }
    } else return null
  }

  private async login (id: string, password: string): Promise<void> {
    const target = 'https://nip.kdca.go.kr/irhp/goLogin.do'
    const csrf = await this.retrieveCsrf(target)

    await this.client.post(
      'https://nip.kdca.go.kr/irhp/goMemberLogin.do',
      {
        _csrf: csrf,
        userId: id,
        userPswd: password,
        userPswdFlag: 'Y',
        menuLv: '6',
        menuCd: '62'
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
  }

  private async retrieveCsrf (target: string): Promise<string> {
    const response = await this.client.get<string>(target, {
      withCredentials: true
    })
    const $ = cheerio.load(response.data)

    const csrf = $('input[name=_csrf]').get()
    return csrf[0].attribs.value
  }
}
