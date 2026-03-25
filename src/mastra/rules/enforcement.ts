export function shouldTriggerCourseCorrection(params: {
  activityToday: number; resultToday: number;
  activity7DayAvg: number; result7DayAvg: number; flatDays: number;
}) {
  const activityUp = params.activityToday > params.activity7DayAvg;
  const resultsFlatOrDown = params.resultToday <= params.result7DayAvg;
  return activityUp && resultsFlatOrDown && params.flatDays >= 3;
}

export function shouldForceExperiment(params: {
  conversionRate: number; targetConversionRate: number;
  activeExperiments: number; flatDays: number;
}) {
  return params.conversionRate < params.targetConversionRate && params.activeExperiments === 0 && params.flatDays >= 3;
}

export function canShadowVerticalTriggerDecision(params: {
  isPrimary: boolean; sampleSize: number;
  promotionThreshold: number; ceoApproved: boolean;
}) {
  if (params.isPrimary) return true;
  return params.sampleSize >= params.promotionThreshold && params.ceoApproved;
}

export function hasMetDecisionThreshold(params: {
  minSampleSize?: number | null; actualSampleSize: number;
  minSendCount?: number | null; actualSendCount: number;
  minSpend?: number | null; actualSpend: number;
}) {
  const sampleOk = params.minSampleSize ? params.actualSampleSize >= params.minSampleSize : true;
  const sendOk = params.minSendCount ? params.actualSendCount >= params.minSendCount : true;
  const spendOk = params.minSpend ? params.actualSpend >= params.minSpend : true;
  return sampleOk && sendOk && spendOk;
}
