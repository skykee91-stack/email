// 핫리드 상담 시 ROI 계산기
// 대행사 비용 vs 셀포 비용 비교

export interface ROIInput {
  agencyCostPerMonth: number    // 현재 대행사 월 비용 (원)
  selfWritingHoursPerWeek: number  // 직접 블로그 쓰는 주당 시간
  hourlyValue: number           // 사장님 시급 환산 (원)
}

export interface ROIResult {
  currentMonthlyCost: number    // 현재 월 비용 (대행사 or 직접)
  sellpoMonthlyCost: number     // 셀포 월 비용
  monthlySaving: number         // 월 절감액
  yearlySaving: number          // 연 절감액
  timeSavedHoursPerMonth: number // 월 절약 시간
  summary: string               // 요약 문구
}

// 셀포 요금제
const SELLPO_PLANS = {
  starter: { name: '스타터', price: 30000, credits: 300 },
  pro: { name: '프로', price: 50000, credits: 500 },
  premium: { name: '프리미엄', price: 100000, credits: 1100 },
}

/**
 * 대행사 사용 중인 경우 ROI 계산
 */
export function calculateROIvsAgency(agencyCost: number): ROIResult {
  const sellpoCost = SELLPO_PLANS.starter.price

  return {
    currentMonthlyCost: agencyCost,
    sellpoMonthlyCost: sellpoCost,
    monthlySaving: agencyCost - sellpoCost,
    yearlySaving: (agencyCost - sellpoCost) * 12,
    timeSavedHoursPerMonth: 0,
    summary: `대행사 월 ${(agencyCost).toLocaleString()}원 → 셀포 월 ${sellpoCost.toLocaleString()}원으로 전환 시 연 ${((agencyCost - sellpoCost) * 12).toLocaleString()}원 절감`
  }
}

/**
 * 직접 블로그 작성하는 경우 ROI 계산
 */
export function calculateROIvsSelfWriting(
  hoursPerWeek: number,
  hourlyValue: number = 20000  // 기본 시급 2만원
): ROIResult {
  const monthlyHours = hoursPerWeek * 4
  const currentCost = monthlyHours * hourlyValue  // 시간 비용
  const sellpoCost = SELLPO_PLANS.starter.price

  return {
    currentMonthlyCost: currentCost,
    sellpoMonthlyCost: sellpoCost,
    monthlySaving: currentCost - sellpoCost,
    yearlySaving: (currentCost - sellpoCost) * 12,
    timeSavedHoursPerMonth: monthlyHours,
    summary: `주 ${hoursPerWeek}시간(월 ${monthlyHours}시간) 블로그 작성 → 셀포로 월 ${monthlyHours}시간 절약, 연 ${((currentCost - sellpoCost) * 12).toLocaleString()}원 가치`
  }
}

/**
 * 상담용 ROI 요약 텍스트 생성
 */
export function generateROISummary(input: ROIInput): string {
  const lines: string[] = []

  if (input.agencyCostPerMonth > 0) {
    const roi = calculateROIvsAgency(input.agencyCostPerMonth)
    lines.push(`📊 대행사 비용 비교`)
    lines.push(`  현재: 월 ${input.agencyCostPerMonth.toLocaleString()}원`)
    lines.push(`  셀포: 월 ${roi.sellpoMonthlyCost.toLocaleString()}원`)
    lines.push(`  → 월 ${roi.monthlySaving.toLocaleString()}원 절감`)
    lines.push(`  → 연 ${roi.yearlySaving.toLocaleString()}원 절감`)
    lines.push('')
  }

  if (input.selfWritingHoursPerWeek > 0) {
    const roi = calculateROIvsSelfWriting(input.selfWritingHoursPerWeek, input.hourlyValue)
    lines.push(`⏰ 시간 비용 비교`)
    lines.push(`  현재: 주 ${input.selfWritingHoursPerWeek}시간 (월 ${input.selfWritingHoursPerWeek * 4}시간)`)
    lines.push(`  셀포: 사진 올리기 5분`)
    lines.push(`  → 월 ${roi.timeSavedHoursPerMonth}시간 절약`)
    lines.push(`  → 시간 가치 환산 연 ${roi.yearlySaving.toLocaleString()}원`)
  }

  return lines.join('\n')
}
