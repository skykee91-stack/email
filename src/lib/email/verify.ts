// 이메일 유효성 검증 (SMTP 레벨)
// 실제 메일을 보내지 않고, 메일 서버에 "이 주소 있어?" 물어보는 방식

import dns from 'dns'
import net from 'net'

// DNS에서 메일 서버(MX 레코드) 조회
function getMxRecords(domain: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses?.length) {
        reject(new Error(`MX 레코드 없음: ${domain}`))
        return
      }
      // 우선순위 순으로 정렬
      const sorted = addresses.sort((a, b) => a.priority - b.priority)
      resolve(sorted.map(a => a.exchange))
    })
  })
}

// SMTP 연결로 이메일 존재 여부 확인
function smtpVerify(email: string, mxHost: string, timeout = 10000): Promise<{ valid: boolean; reason: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let step = 0
    let response = ''

    const cleanup = () => {
      try { socket.destroy() } catch {}
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve({ valid: false, reason: 'timeout' })
    }, timeout)

    socket.on('data', (data) => {
      response = data.toString()

      if (step === 0 && response.startsWith('220')) {
        // 서버 인사 → HELO
        step = 1
        socket.write('HELO sellpo.kr\r\n')
      } else if (step === 1 && response.startsWith('250')) {
        // HELO 응답 → MAIL FROM
        step = 2
        socket.write('MAIL FROM:<verify@sellpo.kr>\r\n')
      } else if (step === 2 && response.startsWith('250')) {
        // MAIL FROM 응답 → RCPT TO (핵심: 여기서 이메일 존재 여부 확인)
        step = 3
        socket.write(`RCPT TO:<${email}>\r\n`)
      } else if (step === 3) {
        clearTimeout(timer)
        socket.write('QUIT\r\n')
        cleanup()

        if (response.startsWith('250')) {
          resolve({ valid: true, reason: 'ok' })
        } else if (response.startsWith('550') || response.startsWith('551') || response.startsWith('553')) {
          resolve({ valid: false, reason: 'not_exist' })
        } else {
          // 일부 서버는 검증을 거부함 (catch-all) → 일단 유효로 간주
          resolve({ valid: true, reason: 'unknown' })
        }
      }
    })

    socket.on('error', () => {
      clearTimeout(timer)
      cleanup()
      // 연결 실패 → 검증 불가 → 일단 유효로 간주
      resolve({ valid: true, reason: 'connection_error' })
    })

    socket.connect(25, mxHost)
  })
}

// MX 레코드 캐시 (도메인별 1회만 조회)
const mxCache: Record<string, string[]> = {}

/**
 * 이메일 유효성 검증
 * @returns { valid: boolean, reason: string }
 *   valid=true: 존재하는 이메일 (발송 OK)
 *   valid=false: 존재하지 않는 이메일 (발송 하면 안 됨)
 */
export async function verifyEmail(email: string): Promise<{ valid: boolean; reason: string }> {
  if (!email || !email.includes('@')) {
    return { valid: false, reason: 'invalid_format' }
  }

  const domain = email.split('@')[1].toLowerCase()

  try {
    // MX 레코드 조회 (캐시 사용)
    if (!mxCache[domain]) {
      mxCache[domain] = await getMxRecords(domain)
    }
    const mxHosts = mxCache[domain]

    // 첫 번째 MX 서버로 검증
    return await smtpVerify(email, mxHosts[0])
  } catch {
    // MX 레코드 없음 = 도메인 자체가 메일을 안 받음
    return { valid: false, reason: 'no_mx_record' }
  }
}

/**
 * 여러 이메일 일괄 검증 (속도 제한 포함)
 */
export async function verifyEmails(emails: string[]): Promise<Record<string, { valid: boolean; reason: string }>> {
  const results: Record<string, { valid: boolean; reason: string }> = {}

  for (const email of emails) {
    results[email] = await verifyEmail(email)
    // 서버 부하 방지: 검증 간 0.5초 대기
    await new Promise(r => setTimeout(r, 500))
  }

  return results
}
