// 셀포 3차 팔로업 - 비교/혜택 강조

export const SELLPO_STEP3_SUBJECT = '{사업자명}님, 대행사 vs 셀포 비교해보세요'

export const SELLPO_STEP3_HTML = `
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
              <h2 style="color:#191F28; font-size:20px; font-weight:700; margin:0 0 20px;">
                <span style="color:#3182F6;">{사업자명}</span>님,<br>대행사 비용 아깝지 않으세요?
              </h2>

              <!-- 비교 테이블 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; border-collapse:collapse;">
                <tr>
                  <td style="padding:12px; background:#F8F9FA; font-size:13px; color:#8B95A1; font-weight:600; border-bottom:2px solid #E5E8EB;"></td>
                  <td style="padding:12px; background:#F8F9FA; font-size:13px; color:#8B95A1; font-weight:600; text-align:center; border-bottom:2px solid #E5E8EB;">대행사</td>
                  <td style="padding:12px; background:#EBF4FF; font-size:13px; color:#3182F6; font-weight:700; text-align:center; border-bottom:2px solid #3182F6;">셀포</td>
                </tr>
                <tr>
                  <td style="padding:12px; font-size:13px; color:#191F28; border-bottom:1px solid #F2F4F6;">월 비용</td>
                  <td style="padding:12px; font-size:13px; color:#191F28; text-align:center; border-bottom:1px solid #F2F4F6;">30~100만원</td>
                  <td style="padding:12px; font-size:13px; color:#3182F6; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFCFF;">3만원~</td>
                </tr>
                <tr>
                  <td style="padding:12px; font-size:13px; color:#191F28; border-bottom:1px solid #F2F4F6;">원고 품질</td>
                  <td style="padding:12px; font-size:13px; color:#191F28; text-align:center; border-bottom:1px solid #F2F4F6;">복붙 원고</td>
                  <td style="padding:12px; font-size:13px; color:#3182F6; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFCFF;">AI 맞춤 원고</td>
                </tr>
                <tr>
                  <td style="padding:12px; font-size:13px; color:#191F28; border-bottom:1px solid #F2F4F6;">상위노출</td>
                  <td style="padding:12px; font-size:13px; color:#191F28; text-align:center; border-bottom:1px solid #F2F4F6;">보장 안됨</td>
                  <td style="padding:12px; font-size:13px; color:#3182F6; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFCFF;">성공률 92%</td>
                </tr>
                <tr>
                  <td style="padding:12px; font-size:13px; color:#191F28;">내 블로그 소유</td>
                  <td style="padding:12px; font-size:13px; color:#191F28; text-align:center;">❌ 대행사 블로그</td>
                  <td style="padding:12px; font-size:13px; color:#3182F6; font-weight:700; text-align:center; background:#FAFCFF;">✅ 내 블로그</td>
                </tr>
              </table>

              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0 0 24px;">
                대행사에 쓰는 비용의 <strong>1/10 가격</strong>으로<br>
                더 좋은 결과를 직접 만들어보세요.
              </p>

              <div style="text-align:center;">
                <a href="https://sellpo.kr" style="display:inline-block; background:#3182F6; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 40px; border-radius:32px; box-shadow:0 8px 16px -4px rgba(49,130,246,0.3);">
                  지금 시작하기 →
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px; background:#F8F9FA; border-top:1px solid #E5E8EB;">
              <p style="color:#8B95A1; font-size:12px; line-height:1.8; margin:0; text-align:center;">
                궁금한 점은 답장으로 물어봐주세요!
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
