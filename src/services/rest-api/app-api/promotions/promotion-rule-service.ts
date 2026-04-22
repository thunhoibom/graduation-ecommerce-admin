import { appApiIns } from '../api-instance'
import { createApiService } from '../../utils'

const promotionRuleService = createApiService(appApiIns, '/api/data/promotion-rules')

export type PromotionConditionOperator =
  | 'EQ'
  | '=='
  | 'NE'
  | '!='
  | 'GT'
  | '>'
  | 'GTE'
  | '>='
  | 'LT'
  | '<'
  | 'LTE'
  | '<='
  | 'IN'

export type PromotionRuleCondition = {
  id?: number
  factField: string
  operator: PromotionConditionOperator
  targetValue: string
}

export type PromotionRuleActionType =
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'FREE_SHIPPING'

export type PromotionRuleAction = {
  id?: number
  actionType: PromotionRuleActionType
  value: number
}

export type PromotionRulePojo = {
  id?: number
  name: string
  priority: number
  combinable: boolean
  active: boolean
  activeFrom?: string
  activeUntil?: string
  mutualExclusionGroup?: string
  conditions: PromotionRuleCondition[]
  actions: PromotionRuleAction[]
}

export const listPromotionRules = () => promotionRuleService.get<PromotionRulePojo[]>('')

export const createPromotionRule = (payload: PromotionRulePojo) =>
  promotionRuleService.post<PromotionRulePojo>('', payload)

export const updatePromotionRule = (id: number, payload: PromotionRulePojo) =>
  promotionRuleService.put<PromotionRulePojo>(`/${id}`, payload)

export const deletePromotionRule = (id: number) =>
  promotionRuleService.delete<void>(`/${id}`)

