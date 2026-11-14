import { DataSource, In } from 'typeorm';
import { UserEntity } from '@/contexts/identity/adapters/outbound/persistence/user.entity';
import { RetailReviewerQuery } from '@/contexts/retail-sales/application/ports/outbound/retailReviewerQuery.port';

export class UserDisplayNameQuery implements RetailReviewerQuery {
  constructor(private readonly dataSource: DataSource) {}

  async findNames(userIds: string[]): Promise<Map<string, string>> {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) {
      return new Map();
    }
    const users = await this.dataSource.getRepository(UserEntity).find({ where: { id: In(ids) } });
    return new Map(users.map((user) => [user.id, user.displayName]));
  }
}
