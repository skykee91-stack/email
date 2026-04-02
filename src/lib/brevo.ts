// Brevo API 클라이언트
// 이메일 발송 + 통계 조회용

const BREVO_API_URL = 'https://api.brevo.com/v3'

function getHeaders() {
  return {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': process.env.BREVO_API_KEY!,
  }
}

export const brevo = {
  // 이메일 발송
  async sendTransacEmail(params: {
    sender: { name: string; email: string }
    to: { email: string; name: string }[]
    subject: string
    htmlContent: string
  }) {
    const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(`Brevo 발송 실패: ${JSON.stringify(err)}`)
    }
    return res.json()
  },

  // 이벤트 조회 (열람, 클릭, 반송 등)
  async getEvents(params: {
    limit?: number
    offset?: number
    startDate?: string
    endDate?: string
    event?: string
  }) {
    const query = new URLSearchParams()
    if (params.limit) query.set('limit', String(params.limit))
    if (params.offset) query.set('offset', String(params.offset))
    if (params.startDate) query.set('startDate', params.startDate)
    if (params.endDate) query.set('endDate', params.endDate)
    if (params.event) query.set('event', params.event)

    const res = await fetch(`${BREVO_API_URL}/smtp/statistics/events?${query}`, {
      headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Brevo 이벤트 조회 실패')
    return res.json()
  },

  // 차단 목록 조회
  async getBlockedContacts(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))

    const res = await fetch(`${BREVO_API_URL}/smtp/blockedContacts?${query}`, {
      headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Brevo 차단 목록 조회 실패')
    return res.json()
  },

  // 계정 정보 (잔여 크레딧 등)
  async getAccount() {
    const res = await fetch(`${BREVO_API_URL}/account`, {
      headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Brevo 계정 조회 실패')
    return res.json()
  },
}
