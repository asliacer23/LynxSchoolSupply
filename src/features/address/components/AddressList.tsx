import { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AddressCard } from './AddressCard';
import { AddressForm } from './AddressForm';
import { getUserAddresses, deleteAddress, setDefaultAddress, UserAddress } from '../services/address.service';

interface AddressListProps {
  userId: string;
  onAddressSelected?: (address: UserAddress) => void;
}

export function AddressList({ userId, onAddressSelected }: AddressListProps) {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    setIsLoading(true);
    const result = await getUserAddresses(userId);
    if (result.success) {
      setAddresses(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to load addresses',
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async (addressId: string) => {
    const result = await deleteAddress(addressId, userId);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      });
      loadAddresses();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to delete address',
      });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    const result = await setDefaultAddress(addressId, userId);
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Default address updated',
      });
      loadAddresses();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to set default address',
      });
    }
  };

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    loadAddresses();
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My Addresses</h3>
        <Button
          onClick={() => {
            setEditingAddress(null);
            setIsFormOpen(true);
          }}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No addresses yet. Add your first address to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(address => (
            <div
              key={address.id}
              onClick={() => onAddressSelected?.(address)}
              className={onAddressSelected ? 'cursor-pointer' : ''}
            >
              <AddressCard
                address={address}
                isDefault={address.is_default}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            </div>
          ))}
        </div>
      )}

      <AddressForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        userId={userId}
        address={editingAddress}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
