// 셀포 4차 마지막 제안 - 긴급성/FOMO

export const SELLPO_STEP4_SUBJECT = '{사업자명}님, 마지막으로 안내드립니다'

export const SELLPO_STEP4_HTML = `
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

          <tr>
            <td style="background:linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); padding:24px 40px; text-align:center;">
              <h1 style="color:#ffffff; font-size:20px; font-weight:800; margin:0;">셀포 SELLPO</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <h2 style="color:#191F28; font-size:20px; font-weight:700; margin:0 0 16px; line-height:1.4;">
                <span style="color:#3182F6;">{사업자명}</span>님,<br>마지막으로 안내드립니다
              </h2>

              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0 0 24px;">
                여러 차례 연락드렸는데 아직 확인을 못 하셨을 수도 있어서<br>
                마지막으로 한번만 더 안내드립니다.
              </p>

              <!-- 핵심 요약 박스 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #EBF4FF 0%, #F0F7FF 100%); border-radius:16px; margin-bottom:24px;">
                <tr><td style="padding:28px; text-align:center;">
                  <p style="color:#3182F6; font-size:14px; font-weight:600; margin:0 0 12px;">셀포가 해결해드리는 것</p>
                  <p style="color:#191F28; font-size:24px; font-weight:800; margin:0 0 4px;">블로그 마케팅 완전 자동화</p>
                  <p style="color:#4E5968; font-size:14px; margin:0;">사진만 올리면 → AI가 원고 작성 → 자동 발행 → 상위노출</p>
                </td></tr>
              </table>

              <!-- 숫자 강조 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="text-align:center; padding:12px;">
                    <p style="color:#3182F6; font-size:28px; font-weight:800; margin:0;">92%</p>
                    <p style="color:#8B95A1; font-size:12px; margin:4px 0 0;">상위노출 성공률</p>
                  </td>
                  <td width="33%" style="text-align:center; padding:12px;">
                    <p style="color:#3182F6; font-size:28px; font-weight:800; margin:0;">10초</p>
                    <p style="color:#8B95A1; font-size:12px; margin:4px 0 0;">원고 작성 시간</p>
                  </td>
                  <td width="33%" style="text-align:center; padding:12px;">
                    <p style="color:#3182F6; font-size:28px; font-weight:800; margin:0;">3만원</p>
                    <p style="color:#8B95A1; font-size:12px; margin:4px 0 0;">월 시작 가격</p>
                  </td>
                </tr>
              </table>

              <p style="color:#191F28; font-size:15px; line-height:1.8; margin:0 0 24px; font-weight:600; text-align:center;">
                이 메일 이후로는 더 이상 연락드리지 않겠습니다.<br>
                관심 있으시면 지금 확인해주세요!
              </p>

              <div style="text-align:center;">
                <a href="https://sellpo.kr" style="display:inline-block; background:#3182F6; color:#ffffff; font-size:16px; font-weight:700; text-decoration:none; padding:16px 48px; border-radius:32px; box-shadow:0 8px 16px -4px rgba(49,130,246,0.3);">
                  셀포 확인하기 →
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px; background:#F8F9FA; border-top:1px solid #E5E8EB;">
              <p style="color:#8B95A1; font-size:12px; line-height:1.8; margin:0; text-align:center;">
                감사합니다. 좋은 하루 보내세요! 🙏
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
