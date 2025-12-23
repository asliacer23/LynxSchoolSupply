import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import {
  getUserAddresses,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  UserAddress,
  CreateAddressInput,
} from '@/features/address/services/address.service';

interface UseAddressesResult {
  addresses: UserAddress[];
  defaultAddress: UserAddress | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  addAddress: (addressInput: CreateAddressInput) => Promise<boolean>;
  editAddress: (addressId: string, addressInput: Partial<CreateAddressInput>) => Promise<boolean>;
  removeAddress: (addressId: string) => Promise<boolean>;
  setAsDefault: (addressId: string) => Promise<boolean>;
}

export function useAddresses(userId: string): UseAddressesResult {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [defaultAddr, setDefaultAddr] = useState<UserAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [addressesResult, defaultResult] = await Promise.all([
        getUserAddresses(userId),
        getDefaultAddress(userId),
      ]);

      if (addressesResult.success) {
        setAddresses(addressesResult.data);
      }
      if (defaultResult.success) {
        setDefaultAddr(defaultResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [userId, refetch]);

  const addAddress = useCallback(
    async (addressInput: CreateAddressInput): Promise<boolean> => {
      const result = await createAddress(userId, addressInput);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Address added successfully',
        });
        await refetch();
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to add address',
        });
        return false;
      }
    },
    [userId, toast, refetch]
  );

  const editAddress = useCallback(
    async (addressId: string, addressInput: Partial<CreateAddressInput>): Promise<boolean> => {
      const result = await updateAddress(addressId, userId, addressInput);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Address updated successfully',
        });
        await refetch();
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to update address',
        });
        return false;
      }
    },
    [userId, toast, refetch]
  );

  const removeAddress = useCallback(
    async (addressId: string): Promise<boolean> => {
      const result = await deleteAddress(addressId, userId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Address deleted successfully',
        });
        await refetch();
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete address',
        });
        return false;
      }
    },
    [userId, toast, refetch]
  );

  const setAsDefault = useCallback(
    async (addressId: string): Promise<boolean> => {
      const result = await setDefaultAddress(addressId, userId);
      if (result?.success) {
        toast({
          title: 'Success',
          description: 'Default address updated',
        });
        await refetch();
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result?.error || 'Failed to set default address',
        });
        return false;
      }
    },
    [userId, toast, refetch]
  );

  return {
    addresses,
    defaultAddress: defaultAddr,
    isLoading,
    refetch,
    addAddress,
    editAddress,
    removeAddress,
    setAsDefault,
  };
}
