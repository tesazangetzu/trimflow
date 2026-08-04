import { Setting } from '../entities/setting.entity';

export interface ISettingService {
  get(key: string, branchId?: string): Promise<string | undefined>;
  set(key: string, value: string, branchId?: string, description?: string): Promise<Setting>;
  getAll(branchId?: string): Promise<Setting[]>;
  delete(key: string, branchId?: string): Promise<void>;
}
