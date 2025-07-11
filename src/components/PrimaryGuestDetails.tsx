
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Eye } from 'lucide-react';

interface PrimaryGuestDetailsProps {
  primaryGuest: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  imagePreview: { [key: string]: string };
  handleMobileChange: (mobile: string) => void;
  handleFileUpload: (file: File, isPrimary?: boolean, memberIndex?: number) => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, isPrimary?: boolean, memberIndex?: number) => void;
  dragActive: boolean;
}

const PrimaryGuestDetails: React.FC<PrimaryGuestDetailsProps> = ({
  primaryGuest,
  setFormData,
  imagePreview,
  handleMobileChange,
  handleFileUpload,
  handleDrag,
  handleDrop,
  dragActive,
}) => {
  const FileUploadArea = () => {
    const hasPreview = imagePreview['primary'];

    return (
      <div className="space-y-2">
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, true)}
          onClick={() => document.getElementById('file-primary')?.click()}
        >
          <input
            id="file-primary"
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0], true);
              }
            }}
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Drag and drop identity proof or click to browse</p>
          <p className="text-xs text-gray-400">Supports PDF, JPG, PNG files</p>
        </div>

        {hasPreview && (
          <div className="relative">
            <img
              src={imagePreview['primary']}
              alt="Identity proof preview"
              className="w-full h-32 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                const newWindow = window.open();
                if (newWindow) {
                  newWindow.document.write(
                    `<img src="${imagePreview['primary']}" style="max-width: 100%; max-height: 100%;" />`
                  );
                }
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Primary Guest Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <Label>First Name</Label>
            <Input
              value={primaryGuest.firstName}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  primaryGuest: { ...prev.primaryGuest, firstName: e.target.value },
                }))
              }
              required
            />
          </div>
          <div className="form-group">
            <Label>Middle Name</Label>
            <Input
              value={primaryGuest.middleName}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  primaryGuest: { ...prev.primaryGuest, middleName: e.target.value },
                }))
              }
            />
          </div>
          <div className="form-group">
            <Label>Last Name</Label>
            <Input
              value={primaryGuest.lastName}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  primaryGuest: { ...prev.primaryGuest, lastName: e.target.value },
                }))
              }
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={primaryGuest.dob}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  primaryGuest: { ...prev.primaryGuest, dob: e.target.value },
                }))
              }
              required
            />
          </div>
          <div className="form-group">
            <Label>Mobile Number</Label>
            <Input
              value={primaryGuest.mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <Label>Address</Label>
          <Textarea
            value={primaryGuest.address}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                primaryGuest: { ...prev.primaryGuest, address: e.target.value },
              }))
            }
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <Label>Identity Proof Type</Label>
            <select
              value={primaryGuest.identityProof}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  primaryGuest: { ...prev.primaryGuest, identityProof: e.target.value },
                }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              required
            >
              <option value="">Select Identity Proof</option>
              <option value="aadhar">Aadhar Card</option>
              <option value="pan">PAN Card</option>
              <option value="passport">Passport</option>
              <option value="voter">Voter ID</option>
            </select>
          </div>
          <div className="form-group">
            <Label>Identity Proof Number</Label>
            <Input
              value={primaryGuest.identityNumber}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  primaryGuest: { ...prev.primaryGuest, identityNumber: e.target.value },
                }))
              }
              placeholder="Enter ID number"
              required
            />
          </div>
          <div className="form-group">
            <Label>Upload Identity Proof</Label>
            <FileUploadArea />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrimaryGuestDetails;
