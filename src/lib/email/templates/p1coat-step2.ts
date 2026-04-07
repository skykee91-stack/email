// 피원코팅즈코리아 2차 - 기술 차별점 강조

export const P1COAT_STEP2_SUBJECT = '{사업자명}님, PPF 필름 대신 뿌리는 코팅 들어보셨나요?'

export const P1COAT_STEP2_HTML = `
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
            <td style="padding:36px 40px 20px;">
              <h2 style="color:#1a1a2e; font-size:20px; font-weight:700; margin:0 0 16px; line-height:1.4;">
                <span style="color:#c9a96e;">{사업자명}</span>님, 지난 메일 보셨나요?
              </h2>
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                기존 PPF 필름과 피원 필러블 코팅의 차이점을 간단히 정리해드려요.
              </p>
            </td>
          </tr>

          <!-- 비교 테이블 -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 16px; background:#F8F9FA; font-size:13px; color:#8B95A1; font-weight:600; border-bottom:2px solid #E5E8EB;"></td>
                  <td style="padding:12px 16px; background:#F8F9FA; font-size:13px; color:#8B95A1; font-weight:600; text-align:center; border-bottom:2px solid #E5E8EB;">기존 PPF 필름</td>
                  <td style="padding:12px 16px; background:#1a1a2e; font-size:13px; color:#c9a96e; font-weight:700; text-align:center; border-bottom:2px solid #c9a96e;">피원 필러블</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; font-weight:600; border-bottom:1px solid #F2F4F6;">시공 방식</td>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; text-align:center; border-bottom:1px solid #F2F4F6;">필름 부착</td>
                  <td style="padding:12px 16px; font-size:13px; color:#c9a96e; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFAFA;">스프레이 도포</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; font-weight:600; border-bottom:1px solid #F2F4F6;">곡면 시공</td>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; text-align:center; border-bottom:1px solid #F2F4F6;">이음새 발생</td>
                  <td style="padding:12px 16px; font-size:13px; color:#c9a96e; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFAFA;">이음새 없음</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; font-weight:600; border-bottom:1px solid #F2F4F6;">제거 시</td>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; text-align:center; border-bottom:1px solid #F2F4F6;">접착제 잔여물</td>
                  <td style="padding:12px 16px; font-size:13px; color:#c9a96e; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFAFA;">잔여물 ZERO</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; font-weight:600; border-bottom:1px solid #F2F4F6;">컬러</td>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; text-align:center; border-bottom:1px solid #F2F4F6;">제한적</td>
                  <td style="padding:12px 16px; font-size:13px; color:#c9a96e; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFAFA;">65,000+ 컬러</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; font-size:13px; color:#1a1a2e; font-weight:600;">환경</td>
                  <td style="padding:12px 16px; font-size:13px; color:#E74C3C; text-align:center;">VOC 발생</td>
                  <td style="padding:12px 16px; font-size:13px; color:#c9a96e; font-weight:700; text-align:center; background:#FAFAFA;">ZERO VOC 수성</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 안내 -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                새로운 시공 메뉴로 매출을 늘려보세요.<br>
                궁금하신 점 있으시면 편하게 답장 주세요!
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
