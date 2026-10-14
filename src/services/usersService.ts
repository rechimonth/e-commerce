import { getCustomerProfiles } from '@/infrastructure/firebase/firestore';
import { firebaseTryCatch } from '@/infrastructure/firebase/config';
import type { CustomerProfileDTO } from '@/infrastructure/firebase/firestore';

export const usersService = {
  async fetchCustomers(): Promise<CustomerProfileDTO[]> {
    return firebaseTryCatch(() => getCustomerProfiles(200));
  },
};
