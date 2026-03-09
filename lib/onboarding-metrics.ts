import { OnboardingResponse } from '@/hooks/useOnboardingResponse';

const MONTH_DAYS = 30;
const YEAR_DAYS = 365;
const PROJECTION_DAYS = 90;

export function getDailyConsumptionAmount(response: OnboardingResponse | null) {
  return response?.daily_consumption_amount ?? 0;
}

export function getDailyConsumptionCost(response: OnboardingResponse | null) {
  const value = response?.daily_consumption_cost;
  return typeof value === 'number' ? value : Number(value ?? 0);
}

export function getOnboardingProjection(response: OnboardingResponse | null) {
  const dailyAmount = getDailyConsumptionAmount(response);
  const dailyCost = getDailyConsumptionCost(response);
  const monthlySpend = Math.round(dailyCost * MONTH_DAYS);
  const yearlySpend = Math.round(dailyCost * YEAR_DAYS);
  const projectedSavings90Days = Math.round(dailyCost * PROJECTION_DAYS);
  const avoidedUnits90Days = dailyAmount * PROJECTION_DAYS;
  const firstName = response?.full_name?.trim().split(/\s+/)[0] ?? null;

  return {
    dailyAmount,
    dailyCost,
    monthlySpend,
    yearlySpend,
    projectedSavings90Days,
    avoidedUnits90Days,
    firstName,
    primaryGoal: response?.primary_goal ?? null,
    targetSelection: response?.target_selection ?? null,
    triggers: response?.triggers ?? [],
  };
}

export function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
