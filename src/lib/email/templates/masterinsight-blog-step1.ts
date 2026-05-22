// 마스터인사이트 블로그 시리즈 1차 — 페인 환기
// 컨셉: "블로그 광고비, 매출로 돌아오고 있나요?"

export const MASTERINSIGHT_BLOG_STEP1_SUBJECT = '{사업자명}님 블로그, 지금 매출 나오고 있나요?'

export const MASTERINSIGHT_BLOG_STEP1_HTML = `
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

          <!-- 로고 헤더 (아이보리 배경 + 검정 가로형 로고) -->
          <tr>
            <td style="background:#FAF8F3; padding:24px 40px; text-align:center; border-bottom:1px solid #EEE9DC;">
              <img src="https://img.mailinblue.com/10939913/images/content_library/original/6a0174ef47b9790e32f56dff.png" alt="Master Insight co." width="240" style="display:inline-block;" />
            </td>
          </tr>

          <!-- 인사말 -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <h2 style="color:#0F0F0F; font-size:20px; font-weight:700; margin:0 0 16px; line-height:1.4;">
                <span style="color:#8B6F47;">{사업자명}</span>님, 안녕하세요!
              </h2>
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                {지역}에서 {업종} 운영하시면서<br>
                블로그에 매달 돈은 들이는데<br>
                매출로 돌아오는지 확인되시나요?
              </p>
            </td>
          </tr>

          <!-- 핵심 메시지 박스 (잉크 블랙 + 슬로건) -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F0F; border-radius:16px;">
                <tr><td style="padding:28px 24px; text-align:center;">
                  <p style="color:#8B6F47; font-size:12px; font-weight:600; margin:0 0 12px; letter-spacing:2.5px;">MASTER INSIGHT co.</p>
                  <p style="color:#ffffff; font-size:19px; font-weight:800; margin:0 0 10px; line-height:1.5;">마케팅을 대행하지 않습니다<br>운영합니다</p>
                  <p style="color:rgba(255,255,255,0.7); font-size:13px; margin:0; line-height:1.7;">매건 결제, 매일 오전 자동 순위체크<br>장기 계약 강요 없는 블로그 운영사</p>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- 숫자 강조 박스 3개 -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center; padding:18px 8px; background:#FAF8F3; border-radius:12px 0 0 12px;">
                    <p style="color:#8B6F47; font-size:22px; font-weight:800; margin:0;">90%</p>
                    <p style="color:#6B6B6B; font-size:11px; margin:6px 0 0;">고객 연장 재계약율</p>
                  </td>
                  <td width="33%" style="text-align:center; padding:18px 8px; background:#FAF8F3; border-left:2px solid #fff; border-right:2px solid #fff;">
                    <p style="color:#8B6F47; font-size:22px; font-weight:800; margin:0;">상위</p>
                    <p style="color:#6B6B6B; font-size:11px; margin:6px 0 0;">노출 + 순위 추적</p>
                  </td>
                  <td width="33%" style="text-align:center; padding:18px 8px; background:#FAF8F3; border-radius:0 12px 12px 0;">
                    <p style="color:#8B6F47; font-size:22px; font-weight:800; margin:0;">100%</p>
                    <p style="color:#6B6B6B; font-size:11px; margin:6px 0 0;">자체 플랫폼 개발</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="color:#4E5968; font-size:15px; line-height:1.8; margin:0;">
                "블로그 대행 매달 돈은 나가는데, 매출은?"<br>
                글은 올라가는데 매출 확신은 안 서시죠.<br><br>
                <strong style="color:#0F0F0F;">다른 대행사는 1년 계약으로 묶어놓고 제대로 관리 안 합니다.</strong><br>
                "블로그 효율 없다"는 말이 그래서 나오는 거예요.<br>
                명품이냐 보세냐 차이입니다 — 할 거면 확실하게.<br><br>
                마스터인사이트는 <strong style="color:#0F0F0F;">매건 결제, 매월 연장</strong>입니다.<br>
                안 쓰면 추가 비용 없고, 매일 오전 순위체크까지 자동.<br>
                자체 플랫폼으로 키워드·노출·전환을 상세 셋팅·관리합니다.<br><br>
                (매월 연장 구조인데도 <strong style="color:#0F0F0F;">고객 90%가 계속 씁니다.</strong>)<br><br>
                관심 있으시면 아래 버튼으로 확인해보시거나<br>
                편하게 전화 주세요!<br><br>
                <strong style="color:#0F0F0F; font-size:16px;">전화 상담 ▶ 010-5610-6023</strong>
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 3개 (사이트 / 제안서 / 전화) -->
          <tr>
            <td style="padding:0 40px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="33%" style="text-align:center; padding:0 4px;">
                  <a href="https://www.xn--hz2b29jgub39hsa140mrqc.com/" style="display:block; background:#0F0F0F; color:#ffffff; font-size:12px; font-weight:700; text-decoration:none; padding:13px 8px; border-radius:24px;">사이트 보기</a>
                </td>
                <td width="33%" style="text-align:center; padding:0 4px;">
                  <a href="https://masterinsight.netlify.app/" style="display:block; background:#8B6F47; color:#ffffff; font-size:12px; font-weight:700; text-decoration:none; padding:13px 8px; border-radius:24px;">제안서 보기</a>
                </td>
                <td width="33%" style="text-align:center; padding:0 4px;">
                  <a href="tel:+82-10-5610-6023" style="display:block; background:#FAF8F3; color:#0F0F0F; font-size:12px; font-weight:700; text-decoration:none; padding:12px 8px; border-radius:24px; border:1.5px solid #0F0F0F;">010-5610-6023</a>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- 법적 필수 정보 -->
          <tr>
            <td style="padding:20px 40px; background:#F2F4F6;">
              <p style="color:#ADB5BD; font-size:11px; line-height:1.8; margin:0; text-align:center;">
                마스터인사이트 | 대표: 박세울, 차기현 | 사업자등록번호: 312-62-00798<br>
                경기도 안양시 동안구 부림로 121, 9층 901-C26호 | 010-5610-6023<br>
                본 메일은 정보통신망법에 의거한 광고 메일입니다.<br>
                수신을 원치 않으시면 <a href="{수신거부URL}" style="color:#8B6F47; text-decoration:underline;">수신거부</a>를 눌러주세요.
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
