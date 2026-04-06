// 셀포 2차 팔로업 - 사회적 증거

export const SELLPO_STEP2_SUBJECT = '{사업자명}님, 같은 {업종} 사장님들은 이렇게 하고 있어요'

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
                <span style="color:#3182F6;">{사업자명}</span>님, 지난 메일 보셨나요?
              </h2>
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                바쁘실 수 있어서 짧게만 공유드릴게요.<br>
                셀포 쓰시는 {업종} 사장님들 이야기입니다.
              </p>
            </td>
          </tr>

          <!-- 후기 카드들 -->
          <tr>
            <td style="padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA; border-radius:16px; overflow:hidden; margin-bottom:12px;">
                <tr>
                  <td style="padding:20px 24px; border-left:4px solid #3182F6;">
                    <p style="color:#3182F6; font-size:12px; font-weight:700; margin:0 0 6px;">★★★★★ 미용실 사장님</p>
                    <p style="color:#191F28; font-size:14px; line-height:1.6; margin:0;">
                      "대행사 월 50만원 쓰다가 바꿨는데,<br>오히려 <strong>예약이 더 늘었어요.</strong>"
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA; border-radius:16px; overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px; border-left:4px solid #3182F6;">
                    <p style="color:#3182F6; font-size:12px; font-weight:700; margin:0 0 6px;">★★★★★ 카페 사장님</p>
                    <p style="color:#191F28; font-size:14px; line-height:1.6; margin:0;">
                      "사진만 올리면 끝이라 진짜 편해요.<br><strong>글 쓸 시간에 장사에 집중</strong>합니다."
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 안내 -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                궁금하신 점 있으시면 아래에서 확인하시거나<br>
                편하게 답장 주세요!
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 2개 -->
          <tr>
            <td style="padding:0 40px 36px; text-align:center;">
              <a href="https://sellpo.kr" style="display:inline-block; background:linear-gradient(135deg, #3182F6 0%, #1B64DA 100%); color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:13px 32px; border-radius:28px; box-shadow:0 8px 20px -4px rgba(49,130,246,0.35); margin-right:8px;">
                셀포 무료 체험 →
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
