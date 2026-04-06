// 셀포 1차 제안서 이메일 HTML 템플릿

export const SELLPO_STEP1_SUBJECT = '{사업자명}님, 블로그 마케팅 직접 하시느라 힘드시죠?'

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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

          <!-- 로고 헤더 -->
          <tr>
            <td style="background:linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); padding:16px 40px; text-align:center;">
              <img src="https://img.mailinblue.com/10939913/images/content_library/original/69d30bc45588fb598df81a5a.png" alt="sellpo" width="320" style="display:inline-block;" />
            </td>
          </tr>

          <!-- 인사말 -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <h2 style="color:#191F28; font-size:20px; font-weight:700; margin:0 0 16px; line-height:1.4;">
                <span style="color:#3182F6;">{사업자명}</span>님, 안녕하세요!
              </h2>
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                {지역}에서 {업종} 운영하시면서<br>
                블로그 마케팅 고민되실 것 같아서 연락드려요.
              </p>
            </td>
          </tr>

          <!-- 핵심 메시지 박스 -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #EBF4FF 0%, #F0F7FF 100%); border-radius:16px;">
                <tr><td style="padding:24px; text-align:center;">
                  <p style="color:#3182F6; font-size:13px; font-weight:600; margin:0 0 8px; letter-spacing:1px;">WHAT WE DO</p>
                  <p style="color:#191F28; font-size:18px; font-weight:800; margin:0 0 8px; line-height:1.4;">사진 한 장이면<br>블로그 마케팅 끝</p>
                  <p style="color:#4E5968; font-size:13px; margin:0;">AI 원고 작성 → 자동 발행 → 상위노출 부스팅</p>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- 숫자 강조 -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center; padding:16px 8px; background:#F8F9FA; border-radius:12px 0 0 12px;">
                    <p style="color:#3182F6; font-size:24px; font-weight:800; margin:0;">92%</p>
                    <p style="color:#8B95A1; font-size:11px; margin:4px 0 0;">상위노출 성공률</p>
                  </td>
                  <td width="33%" style="text-align:center; padding:16px 8px; background:#F8F9FA; border-left:2px solid #fff; border-right:2px solid #fff;">
                    <p style="color:#3182F6; font-size:24px; font-weight:800; margin:0;">10초</p>
                    <p style="color:#8B95A1; font-size:11px; margin:4px 0 0;">원고 작성 시간</p>
                  </td>
                  <td width="33%" style="text-align:center; padding:16px 8px; background:#F8F9FA; border-radius:0 12px 12px 0;">
                    <p style="color:#3182F6; font-size:24px; font-weight:800; margin:0;">3만원</p>
                    <p style="color:#8B95A1; font-size:11px; margin:4px 0 0;">월 시작 가격</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                관심 있으시면 아래 버튼으로 확인해보시거나<br>
                편하게 답장 주세요!
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 2개 -->
          <tr>
            <td style="padding:0 40px 36px; text-align:center;">
              <a href="https://sellpo.kr" style="display:inline-block; background:linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:13px 32px; border-radius:28px; box-shadow:0 8px 20px -4px rgba(49,130,246,0.35); margin-right:8px;">
                셀포 알아보기 →
              </a>
              <a href="http://pf.kakao.com/_xbxnlMX" style="display:inline-block; background:#FEE500; color:#191F28; font-size:14px; font-weight:700; text-decoration:none; padding:13px 32px; border-radius:28px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                카카오톡 상담 →
              </a>
            </td>
          </tr>

          <!-- 법적 필수 정보 -->
          <tr>
            <td style="padding:20px 40px; background:#F2F4F6;">
              <p style="color:#ADB5BD; font-size:11px; line-height:1.8; margin:0; text-align:center;">
                (주)마스터인사이트 | 대표: 박세울, 차기현<br>
                경기도 안양시 엘에스로142 704호 | 010-9755-6243<br>
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
