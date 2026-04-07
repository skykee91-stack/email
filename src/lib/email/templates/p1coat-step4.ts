// 피원코팅즈코리아 4차 - 마지막 안내

export const P1COAT_STEP4_SUBJECT = '{사업자명}님, 마지막으로 한 가지만 안내드릴게요'

export const P1COAT_STEP4_HTML = `
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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

          <!-- 로고 헤더 -->
          <tr>
            <td style="background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding:16px 40px; text-align:center;">
              <img src="https://img.mailinblue.com/10939913/images/content_library/original/69d317f45588fb598df81ab7.png" alt="P1 Coatings" width="320" style="display:inline-block;" />
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#1a1a2e; font-size:20px; font-weight:700; margin:0 0 20px; line-height:1.4;">
                <span style="color:#c9a96e;">{사업자명}</span>님,<br>마지막으로 인사드려요
              </h2>

              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0 0 20px;">
                몇 차례 메일 드렸는데 바쁘신 것 같아서<br>
                이번 메일을 마지막으로 더 이상 연락드리지 않으려고 합니다.
              </p>

              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0 0 20px;">
                혹시 나중에라도 필러블 코팅 대리점에 관심이 생기시면<br>
                아래 버튼이나 이 메일에 답장만 주시면 됩니다.<br>
                언제든 안내해드릴게요.
              </p>

              <p style="color:#1a1a2e; font-size:15px; line-height:1.8; margin:0;">
                사업 번창하시길 바랍니다.<br>
                감사합니다.
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 2개 -->
          <tr>
            <td style="padding:0 40px 36px; text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="33%" style="text-align:center; padding:0 4px;">
                  <a href="https://peelable.kr/brand01" style="display:block; background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color:#ffffff; font-size:12px; font-weight:700; text-decoration:none; padding:11px 8px; border-radius:24px;">알아보기</a>
                </td>
                <td width="33%" style="text-align:center; padding:0 4px;">
                  <a href="http://pf.kakao.com/_xopfQn" style="display:block; background:#FEE500; color:#191F28; font-size:12px; font-weight:700; text-decoration:none; padding:11px 8px; border-radius:24px;">카카오톡</a>
                </td>
                <td width="33%" style="text-align:center; padding:0 4px;">
                  <a href="https://blog.naver.com/p1cotingskorea" style="display:block; background:#03C75A; color:#ffffff; font-size:12px; font-weight:700; text-decoration:none; padding:11px 8px; border-radius:24px;">포트폴리오</a>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- 법적 필수 정보 -->
          <tr>
            <td style="padding:20px 40px; background:#F2F4F6;">
              <p style="color:#ADB5BD; font-size:11px; line-height:1.8; margin:0; text-align:center;">
                (주)필러블 | 대표: 서기용, 정민호<br>
                부산광역시 기장군 일광읍 기장대로 1017 | 010-8273-5883<br>
                본 메일은 정보통신망법에 의거한 광고 메일입니다.<br>
                수신을 원치 않으시면 <a href="{수신거부URL}" style="color:#c9a96e; text-decoration:underline;">수신거부</a>를 눌러주세요.
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
