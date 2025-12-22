import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateUserAddressAndContact } from '../services/address.service';

interface AddressEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentAddress?: string | null;
  currentContactNum?: string | null;
  onSuccess?: () => void;
}

export function AddressEditor({
  isOpen,
  onOpenChange,
  userId,
  currentAddress = '',
  currentContactNum = '',
  onSuccess,
}: AddressEditorProps) {
  const [address, setAddress] = useState(currentAddress || '');
  const [contactNum, setContactNum] = useState(currentContactNum || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Address is required',
      });
      return;
    }

    if (!contactNum.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Contact number is required',
      });
      return;
    }

    setIsLoading(true);
    const result = await updateUserAddressAndContact(userId, address, contactNum);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Your address has been updated',
      });
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update address',
      });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      // When opening, update the form with current values
      setAddress(currentAddress || '');
      setContactNum(currentContactNum || '');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Delivery Address</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Enter your full delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNum">
              Contact Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactNum"
              placeholder="Enter your contact number"
              value={contactNum}
              onChange={(e) => setContactNum(e.target.value)}
              disabled={isLoading}
            />
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
