import { useState } from 'react';
import { Loader2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateAddressAndContact } from '../services/address.service';
import type { Profile } from '@/types/database';

interface AddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  userId: string;
  onAddressUpdated?: (profile: Profile) => void;
}

export function AddressModal({
  open,
  onOpenChange,
  profile,
  userId,
  onAddressUpdated,
}: AddressModalProps) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(profile?.address || '');
  const [contactNum, setContactNum] = useState(profile?.contact_num || '');
  const { toast } = useToast();

  const hasAddress = !!profile?.address;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your address',
      });
      return;
    }

    if (!contactNum.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your contact number',
      });
      return;
    }

    setLoading(true);
    const result = await updateAddressAndContact(
      userId,
      address.trim(),
      contactNum.trim()
    );
    setLoading(false);

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: result.error?.message || 'Failed to update address',
      });
      return;
    }

    toast({
      title: hasAddress ? 'Address updated' : 'Address added',
      description: hasAddress
        ? 'Your address has been updated successfully.'
        : 'Your address has been added successfully.',
    });

    if (result.data && onAddressUpdated) {
      onAddressUpdated(result.data);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {hasAddress ? 'Edit Address' : 'Add Address'}
          </DialogTitle>
          <DialogDescription>
            {hasAddress
              ? 'Update your delivery address and contact information'
              : 'Add your delivery address and contact information'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="address"
                placeholder="Enter your complete address (street, barangay, city, province)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNum" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Number
              </Label>
              <Input
                id="contactNum"
                type="tel"
                placeholder="e.g., +63 9XX XXX XXXX or (02) XXXX-XXXX"
                value={contactNum}
                onChange={(e) => setContactNum(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasAddress ? 'Update Address' : 'Add Address'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
