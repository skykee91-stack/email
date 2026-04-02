// 셀포 1차 제안서 이메일 HTML 템플릿
// 셀포 브랜드 컬러: #3182F6 (블루), #191F28 (텍스트), #F2F4F6 (배경)

export const SELLPO_STEP1_SUBJECT = '{사업자명}님, 블로그 마케팅 자동화로 매출을 올려보세요'

export const SELLPO_STEP1_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#F2F4F6; font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F6; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- 헤더 (셀포 블루) -->
          <tr>
            <td style="background: linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); padding:32px 40px; text-align:center;">
              <h1 style="color:#ffffff; font-size:24px; font-weight:800; margin:0; letter-spacing:-0.5px;">셀포 SELLPO</h1>
              <p style="color:rgba(255,255,255,0.85); font-size:14px; margin:8px 0 0; font-weight:500;">AI 블로그 마케팅 자동화 플랫폼</p>
            </td>
          </tr>

          <!-- 인사말 -->
          <tr>
            <td style="padding:40px 40px 0;">
              <h2 style="color:#191F28; font-size:22px; font-weight:700; margin:0 0 8px; line-height:1.4;">
                안녕하세요, <span style="color:#3182F6;">{사업자명}</span>님!
              </h2>
              <p style="color:#4E5968; font-size:15px; line-height:1.7; margin:0;">
                {지역}에서 {업종}을 운영하고 계신 것으로 알고 있습니다.<br>
                혹시 블로그 마케팅, 이런 고민 있으신가요?
              </p>
            </td>
          </tr>

          <!-- 고민 포인트 -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9FA; border-radius:12px; padding:20px;">
                <tr><td style="padding:8px 20px;">
                  <p style="color:#191F28; font-size:14px; margin:0; line-height:2;">
                    😤 대행사 맡기면 비용만 나가고 효과는 없고...<br>
                    😫 직접 블로그 쓰자니 시간이 없고...<br>
                    😰 상위노출이 안 되니 손님이 안 오고...
                  </p>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- 셀포 소개 -->
          <tr>
            <td style="padding:0 40px;">
              <h3 style="color:#191F28; font-size:18px; font-weight:700; margin:0 0 16px;">
                사장님은 사진만, 나머지는 셀포가 ✨
              </h3>
            </td>
          </tr>

          <!-- 기능 카드들 -->
          <tr>
            <td style="padding:0 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right:8px;">
                    <div style="background:#EBF4FF; border-radius:12px; padding:20px; text-align:center;">
                      <p style="font-size:28px; margin:0 0 8px;">⚡</p>
                      <p style="color:#191F28; font-size:14px; font-weight:700; margin:0;">AI 자동 원고</p>
                      <p style="color:#4E5968; font-size:12px; margin:4px 0 0;">10초만에 전문 원고 완성</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left:8px;">
                    <div style="background:#EBF4FF; border-radius:12px; padding:20px; text-align:center;">
                      <p style="font-size:28px; margin:0 0 8px;">📈</p>
                      <p style="color:#191F28; font-size:14px; font-weight:700; margin:0;">상위노출 부스팅</p>
                      <p style="color:#4E5968; font-size:12px; margin:4px 0 0;">성공률 92%</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right:8px;">
                    <div style="background:#EBF4FF; border-radius:12px; padding:20px; text-align:center;">
                      <p style="font-size:28px; margin:0 0 8px;">🤖</p>
                      <p style="color:#191F28; font-size:14px; font-weight:700; margin:0;">완전 자동화</p>
                      <p style="color:#4E5968; font-size:12px; margin:4px 0 0;">사진만 올리면 자동 발행</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left:8px;">
                    <div style="background:#EBF4FF; border-radius:12px; padding:20px; text-align:center;">
                      <p style="font-size:28px; margin:0 0 8px;">💰</p>
                      <p style="color:#191F28; font-size:14px; font-weight:700; margin:0;">대행사 비용 0원</p>
                      <p style="color:#4E5968; font-size:12px; margin:4px 0 0;">월 3만원부터</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 가격 -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA; border-radius:12px;">
                <tr><td style="padding:20px; text-align:center;">
                  <p style="color:#4E5968; font-size:13px; margin:0 0 4px;">스타터 플랜</p>
                  <p style="color:#191F28; font-size:28px; font-weight:800; margin:0;">월 30,000원</p>
                  <p style="color:#4E5968; font-size:13px; margin:4px 0 0;">부터 시작 · 300크레딧 제공</p>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding:0 40px 32px; text-align:center;">
              <a href="https://sellpo.kr" style="display:inline-block; background:#3182F6; color:#ffffff; font-size:16px; font-weight:700; text-decoration:none; padding:16px 48px; border-radius:32px; box-shadow:0 8px 16px -4px rgba(49,130,246,0.3);">
                셀포 무료로 시작하기 →
              </a>
            </td>
          </tr>

          <!-- 하단 -->
          <tr>
            <td style="padding:24px 40px; background:#F8F9FA; border-top:1px solid #E5E8EB;">
              <p style="color:#8B95A1; font-size:12px; line-height:1.8; margin:0; text-align:center;">
                궁금하신 점이 있으시면 이 메일에 바로 답장해주세요!<br>
                빠르게 안내해드리겠습니다. 😊
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
