// 셀포 2차 팔로업 이메일 템플릿

export const SELLPO_STEP2_SUBJECT = '{사업자명}님, 셀포 무료 체험 아직 가능합니다'

export const SELLPO_STEP2_HTML = `
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

          <!-- 헤더 -->
          <tr>
            <td style="background:linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); padding:24px 40px; text-align:center;">
              <h1 style="color:#ffffff; font-size:20px; font-weight:800; margin:0;">셀포 SELLPO</h1>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#191F28; font-size:20px; font-weight:700; margin:0 0 16px; line-height:1.4;">
                <span style="color:#3182F6;">{사업자명}</span>님, 지난번 메일 확인하셨나요?
              </h2>

              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0 0 24px;">
                혹시 바쁘셔서 놓치셨을까봐 다시 한번 연락드립니다. 😊<br><br>
                셀포를 사용하시는 {업종} 사장님들의 후기를 공유드릴게요.
              </p>

              <!-- 후기 카드 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#F0F7FF; border-left:4px solid #3182F6; border-radius:0 12px 12px 0; padding:20px;">
                    <p style="color:#191F28; font-size:14px; font-weight:600; margin:0 0 4px;">⭐ 미용실 A 사장님</p>
                    <p style="color:#4E5968; font-size:13px; line-height:1.6; margin:0;">
                      "대행사에 월 50만원 쓰다가 셀포로 바꿨어요. 월 3만원으로 오히려 예약이 더 늘었습니다."
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#F0F7FF; border-left:4px solid #3182F6; border-radius:0 12px 12px 0; padding:20px;">
                    <p style="color:#191F28; font-size:14px; font-weight:600; margin:0 0 4px;">⭐ 카페 B 사장님</p>
                    <p style="color:#4E5968; font-size:13px; line-height:1.6; margin:0;">
                      "사진만 올리면 알아서 블로그가 올라가니까 너무 편해요. 상위노출도 잘 되고요."
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0 0 24px;">
                지금 가입하시면 <strong style="color:#3182F6;">무료 크레딧</strong>으로 바로 체험해보실 수 있어요!
              </p>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="https://sellpo.kr" style="display:inline-block; background:#3182F6; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 40px; border-radius:32px; box-shadow:0 8px 16px -4px rgba(49,130,246,0.3);">
                  무료로 체험하기 →
                </a>
              </div>
            </td>
          </tr>

          <!-- 하단 -->
          <tr>
            <td style="padding:20px 40px; background:#F8F9FA; border-top:1px solid #E5E8EB;">
              <p style="color:#8B95A1; font-size:12px; line-height:1.8; margin:0; text-align:center;">
                답장 주시면 맞춤 상담해드릴게요!
              </p>
            </td>
          </tr>

          <!-- 법적 필수 정보 -->
          <tr>
            <td style="padding:16px 40px 24px; background:#F2F4F6;">
              <p style="color:#ADB5BD; font-size:11px; line-height:1.8; margin:0; text-align:center;">
                (주)마스터인사이트 | 대표: 박세울, 차기현<br>
                경기도 안양시 엘에스로142 704호 | 010-9755-6243<br><br>
                본 메일은 정보통신망법에 의거한 광고 메일입니다.<br>
                수신을 원치 않으시면 <a href="{수신거부URL}" style="color:#3182F6; text-decoration:underline;">수신거부</a>를 눌러주세요.
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
