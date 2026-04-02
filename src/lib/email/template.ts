// 이메일 템플릿 변수 치환 + 법률 자동 삽입

interface Business {
  name: string
  category: string | null
  region: string | null
  email: string | null
}

interface Template {
  subject: string
  htmlBody: string
}

export function renderTemplate(template: Template, business: Business) {
  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://email-kappa-teal.vercel.app'
  const unsubscribeUrl = generateUnsubscribeUrl(business.email!, siteUrl)

  const variables: Record<string, string> = {
    '{사업자명}': business.name || '대표님',
    '{업종}': business.category || '업체',
    '{지역}': business.region || '',
    '{수신거부링크}': unsubscribeUrl,
  }

  let subject = template.subject
  let body = template.htmlBody

  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replaceAll(key, value)
    body = body.replaceAll(key, value)
  }

  // 법률 필수: 제목에 (광고) 삽입
  if (!subject.startsWith('(광고)')) {
    subject = `(광고) ${subject}`
  }

  // 법률 필수: 하단에 발신자 정보 + 수신거부 링크
  body = appendLegalFooter(body, unsubscribeUrl)

  return { subject, body }
}

function generateUnsubscribeUrl(email: string, siteUrl: string): string {
  const token = Buffer.from(email).toString('base64url')
  return `${siteUrl}/unsubscribe?token=${token}`
}

function appendLegalFooter(html: string, unsubscribeUrl: string): string {
  const footer = `
    <div style="margin-top:30px; padding-top:15px; border-top:1px solid #ddd;
                font-size:11px; color:#888; line-height:1.6;">
      <p>본 메일은 정보통신망법에 의거하여 발송되었습니다.</p>
      <p>발신: [회사명] | 사업자등록번호: [000-00-00000]</p>
      <p>주소: [회사 주소] | 연락처: [전화번호]</p>
      <p><a href="${unsubscribeUrl}" style="color:#888;">수신거부</a>를 원하시면 클릭해주세요.</p>
    </div>
  `
  if (html.includes('</body>')) {
    return html.replace('</body>', `${footer}</body>`)
  }
  return html + footer
}
