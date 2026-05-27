/** Resume optimization credits per plan */
export const PLAN_OPTIMIZATION_LIMITS = {
  free: 2,
  starter: 5,
  power: 999,
} as const

export type PlanId = keyof typeof PLAN_OPTIMIZATION_LIMITS
