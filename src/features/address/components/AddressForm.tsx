import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createAddress, updateAddress, UserAddress, CreateAddressInput } from '../services/address.service';

interface AddressFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  address?: UserAddress | null;
  onSuccess?: () => void;
}

export function AddressForm({
  isOpen,
  onOpenChange,
  userId,
  address,
  onSuccess,
}: AddressFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAddressInput>({
    label: address?.label || '',
    recipient_name: address?.recipient_name || '',
    contact_num: address?.contact_num || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postal_code: address?.postal_code || '',
    country: address?.country || 'PH',
    is_default: address?.is_default || false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_default: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.address_line1.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Address Line 1 is required',
      });
      return;
    }

    if (!formData.city.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'City is required',
      });
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (address?.id) {
        result = await updateAddress(address.id, userId, formData);
      } else {
        result = await createAddress(userId, formData);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: address?.id ? 'Address updated successfully' : 'Address created successfully',
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to save address',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setFormData({
        label: address?.label || '',
        recipient_name: address?.recipient_name || '',
        contact_num: address?.contact_num || '',
        address_line1: address?.address_line1 || '',
        address_line2: address?.address_line2 || '',
        city: address?.city || '',
        state: address?.state || '',
        postal_code: address?.postal_code || '',
        country: address?.country || 'PH',
        is_default: address?.is_default || false,
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {address?.id ? 'Edit Address' : 'Add New Address'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label (e.g., Home, Office)</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g., Home or Office"
              value={formData.label || ''}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_name">Recipient Name</Label>
            <Input
              id="recipient_name"
              name="recipient_name"
              placeholder="Full name of recipient"
              value={formData.recipient_name || ''}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_num">Contact Number</Label>
            <Input
              id="contact_num"
              name="contact_num"
              placeholder="Your contact number"
              value={formData.contact_num || ''}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line1">
              Address Line 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address_line1"
              name="address_line1"
              placeholder="Street address"
              value={formData.address_line1}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              name="address_line2"
              placeholder="Apartment, suite, etc. (optional)"
              value={formData.address_line2 || ''}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                name="state"
                placeholder="State/Province"
                value={formData.state || ''}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                name="postal_code"
                placeholder="Postal code"
                value={formData.postal_code || ''}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default || false}
              onCheckedChange={handleCheckboxChange}
              disabled={isLoading}
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default address
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Save Address'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
