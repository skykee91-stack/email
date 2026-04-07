// 피원코팅즈코리아 1차 - 대리점 모집 제안

export const P1COAT_STEP1_SUBJECT = '{사업자명}님, 수성 필러블 코팅 대리점 모집 안내드려요'

export const P1COAT_STEP1_HTML = `
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

          <!-- 인사말 -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <h2 style="color:#1a1a2e; font-size:20px; font-weight:700; margin:0 0 16px; line-height:1.4;">
                <span style="color:#c9a96e;">{사업자명}</span>님, 안녕하세요!
              </h2>
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                {지역}에서 {업종} 운영하고 계신 것으로 알고 있습니다.<br>
                국내 최초 <strong style="color:#1a1a2e;">수성 기반 필러블 코팅</strong> 대리점 모집 안내드려요.
              </p>
            </td>
          </tr>

          <!-- 핵심 메시지 -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius:16px;">
                <tr><td style="padding:24px; text-align:center;">
                  <p style="color:#c9a96e; font-size:13px; font-weight:600; margin:0 0 8px; letter-spacing:2px;">NO PAINT ! ONLY PROTECTION</p>
                  <p style="color:#ffffff; font-size:18px; font-weight:800; margin:0 0 8px; line-height:1.4;">뿌리는 PPF, 필러블 코팅<br>전국 파트너 대리점 모집</p>
                  <p style="color:rgba(255,255,255,0.7); font-size:13px; margin:0;">도장 손상 ZERO · 친환경 수성 · 언제든 제거 가능</p>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- 대리점 혜택 -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="color:#1a1a2e; font-size:16px; font-weight:700; margin:0 0 12px;">파트너 대리점 혜택</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 16px; background:#F8F9FA; border-radius:12px 12px 0 0; border-bottom:2px solid #fff;">
                    <p style="color:#1a1a2e; font-size:14px; margin:0;"><strong style="color:#c9a96e;">01</strong> &nbsp; 수성 필러블 코팅 전문 교육</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; background:#F8F9FA; border-bottom:2px solid #fff;">
                    <p style="color:#1a1a2e; font-size:14px; margin:0;"><strong style="color:#c9a96e;">02</strong> &nbsp; 장비 및 재료 공급</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; background:#F8F9FA; border-bottom:2px solid #fff;">
                    <p style="color:#1a1a2e; font-size:14px; margin:0;"><strong style="color:#c9a96e;">03</strong> &nbsp; 기술 매뉴얼 · 시공 가이드 제공</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; background:#F8F9FA; border-bottom:2px solid #fff;">
                    <p style="color:#1a1a2e; font-size:14px; margin:0;"><strong style="color:#c9a96e;">04</strong> &nbsp; 영업 · 마케팅 지원</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px; background:#F8F9FA; border-radius:0 0 12px 12px;">
                    <p style="color:#1a1a2e; font-size:14px; margin:0;"><strong style="color:#c9a96e;">05</strong> &nbsp; 전국 공식 A/S 관리 시스템</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 안내 -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                관심 있으시면 아래 버튼으로 확인하시거나<br>
                편하게 답장 주세요!
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
