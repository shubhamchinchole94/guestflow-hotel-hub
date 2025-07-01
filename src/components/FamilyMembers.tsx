
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface FamilyMembersProps {
  familyMembers: any[];
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  FileUploadArea: React.ComponentType<{ isPrimary?: boolean; memberIndex?: number }>;
}

const FamilyMembers: React.FC<FamilyMembersProps> = ({
  familyMembers,
  setFormData,
  FileUploadArea,
}) => {
  const addFamilyMember = () => {
    setFormData((prev: any) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        {
          firstName: '',
          middleName: '',
          lastName: '',
          dob: '',
          mobile: '',
          address: '',
          identityProof: '',
          identityNumber: '',
          identityFile: null,
        },
      ],
    }));
  };

  const removeFamilyMember = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateFamilyMember = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member: any, i: number) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Family Members</CardTitle>
          <Button type="button" onClick={addFamilyMember} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Family Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {familyMembers.map((member, index) => (
          <div key={index} className="border rounded-lg p-4 mb-4 relative">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => removeFamilyMember(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <Label>First Name</Label>
                  <Input
                    value={member.firstName}
                    onChange={(e) => updateFamilyMember(index, 'firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label>Middle Name</Label>
                  <Input
                    value={member.middleName}
                    onChange={(e) => updateFamilyMember(index, 'middleName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <Label>Last Name</Label>
                  <Input
                    value={member.lastName}
                    onChange={(e) => updateFamilyMember(index, 'lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={member.dob}
                    onChange={(e) => updateFamilyMember(index, 'dob', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label>Mobile Number</Label>
                  <Input
                    value={member.mobile}
                    onChange={(e) => updateFamilyMember(index, 'mobile', e.target.value)}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="form-group">
                  <Label>Identity Proof Type</Label>
                  <select
                    value={member.identityProof}
                    onChange={(e) => updateFamilyMember(index, 'identityProof', e.target.value)}
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
                    value={member.identityNumber || ''}
                    onChange={(e) => updateFamilyMember(index, 'identityNumber', e.target.value)}
                    placeholder="Enter ID number"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <div className="form-group">
                    <Label>Upload Identity Proof</Label>
                    <FileUploadArea isPrimary={false} memberIndex={index} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FamilyMembers;
