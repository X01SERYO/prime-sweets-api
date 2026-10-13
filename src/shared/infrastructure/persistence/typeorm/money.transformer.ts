export const moneyTransformer = {
  to: (value: number | null | undefined) => value ?? null,
  from: (value: string | number | null): number | null =>
    value === null || value === undefined ? null : Number(value)
};
