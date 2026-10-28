export function calculateMembershipEconomics({annualFeeCents,discountPercent,transactionSavingsCapCents,annualSavingsCapCents,averageTransactionValueCents,averageGrossMarginCents,expectedAnnualTransactions}){
  const estimatedTransactionValue=averageTransactionValueCents??averageGrossMarginCents*2;
  const perTransaction=Math.min(transactionSavingsCapCents||Number.MAX_SAFE_INTEGER,Math.round((estimatedTransactionValue*discountPercent)/100));
  const projectedDiscountCostCents=Math.min(annualSavingsCapCents,perTransaction*expectedAnnualTransactions);
  const projectedNetCents=annualFeeCents+(averageGrossMarginCents*expectedAnnualTransactions)-projectedDiscountCostCents;
  const contribution=Math.max(1,averageGrossMarginCents-perTransaction);const breakEvenPurchases=Math.ceil(Math.max(0,projectedDiscountCostCents-annualFeeCents)/contribution);
  return{projectedDiscountCostCents,projectedNetCents,breakEvenPurchases,profitable:projectedNetCents>=0};
}
