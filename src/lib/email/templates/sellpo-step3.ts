// 셀포 3차 팔로업 - 비용 비교

export const SELLPO_STEP3_SUBJECT = '{사업자명}님, 대행사에 매달 30만원 이상 쓰고 계신가요?'

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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">

          <!-- 로고 헤더 -->
          <tr>
            <td style="background:linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); padding:16px 40px; text-align:center;">
              <img src="https://img.mailinblue.com/10939913/images/content_library/original/69d30bc45588fb598df81a5a.png" alt="sellpo" width="320" style="display:inline-block;" />
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <h2 style="color:#191F28; font-size:20px; font-weight:700; margin:0 0 16px; line-height:1.4;">
                <span style="color:#3182F6;">{사업자명}</span>님,<br>대행사 비용 아깝지 않으세요?
              </h2>
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                보통 대행사 월 30~100만원인데,<br>
                셀포는 같은 일을 <strong style="color:#3182F6;">월 3만원</strong>에 해드려요.
              </p>
            </td>
          </tr>

          <!-- 비교 테이블 -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 16px; background:#F8F9FA; font-size:13px; color:#8B95A1; font-weight:600; border-bottom:2px solid #E5E8EB;"></td>
                  <td style="padding:12px 16px; background:#F8F9FA; font-size:13px; color:#8B95A1; font-weight:600; text-align:center; border-bottom:2px solid #E5E8EB;">대행사</td>
                  <td style="padding:12px 16px; background:#EBF4FF; font-size:13px; color:#3182F6; font-weight:700; text-align:center; border-bottom:2px solid #3182F6;">셀포</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px; font-size:13px; color:#191F28; font-weight:600; border-bottom:1px solid #F2F4F6;">💰 월 비용</td>
                  <td style="padding:14px 16px; font-size:13px; color:#191F28; text-align:center; border-bottom:1px solid #F2F4F6;">30~100만원</td>
                  <td style="padding:14px 16px; font-size:14px; color:#3182F6; font-weight:800; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFCFF;">3만원~</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px; font-size:13px; color:#191F28; font-weight:600; border-bottom:1px solid #F2F4F6;">📝 원고 품질</td>
                  <td style="padding:14px 16px; font-size:13px; color:#191F28; text-align:center; border-bottom:1px solid #F2F4F6;">복붙 원고</td>
                  <td style="padding:14px 16px; font-size:13px; color:#3182F6; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFCFF;">AI 맞춤 원고</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px; font-size:13px; color:#191F28; font-weight:600; border-bottom:1px solid #F2F4F6;">📈 상위노출</td>
                  <td style="padding:14px 16px; font-size:13px; color:#191F28; text-align:center; border-bottom:1px solid #F2F4F6;">보장 안됨</td>
                  <td style="padding:14px 16px; font-size:13px; color:#3182F6; font-weight:700; text-align:center; border-bottom:1px solid #F2F4F6; background:#FAFCFF;">92% 성공률</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px; font-size:13px; color:#191F28; font-weight:600;">🏠 블로그 소유</td>
                  <td style="padding:14px 16px; font-size:13px; color:#E74C3C; text-align:center;">❌ 대행사 블로그</td>
                  <td style="padding:14px 16px; font-size:13px; color:#3182F6; font-weight:700; text-align:center; background:#FAFCFF;">✅ 내 블로그</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 안내 -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                궁금하신 점 있으시면 편하게 답장 주세요!
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 2개 -->
          <tr>
            <td style="padding:0 40px 36px; text-align:center;">
              <a href="https://sellpo.kr" style="display:inline-block; background:linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:13px 32px; border-radius:28px; box-shadow:0 8px 20px -4px rgba(49,130,246,0.35); margin-right:8px;">
                셀포 비교해보기 →
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
