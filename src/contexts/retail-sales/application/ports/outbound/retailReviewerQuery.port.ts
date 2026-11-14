export interface RetailReviewerQuery {
  findNames(userIds: string[]): Promise<Map<string, string>>;
}
