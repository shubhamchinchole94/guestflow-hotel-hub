
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Edit } from 'lucide-react';

interface Company {
  id: string;
  companyName: string;
  agentName: string;
  agentNumber: string;
  mailId: string;
  gstPercentage: number;
  roomPriceDiscount: number;
}

const CompanyMaster = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Company, 'id'>>({
    companyName: '',
    agentName: '',
    agentNumber: '',
    mailId: '',
    gstPercentage: 18,
    roomPriceDiscount: 0
  });

  useEffect(() => {
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }
  }, []);

  const saveCompanies = (updatedCompanies: Company[]) => {
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      const updatedCompanies = companies.map(company =>
        company.id === isEditing ? { ...formData, id: isEditing } : company
      );
      saveCompanies(updatedCompanies);
      toast({
        title: "Success",
        description: "Company updated successfully"
      });
    } else {
      const newCompany: Company = {
        ...formData,
        id: Date.now().toString()
      };
      saveCompanies([...companies, newCompany]);
      toast({
        title: "Success",
        description: "Company added successfully"
      });
    }

    setFormData({
      companyName: '',
      agentName: '',
      agentNumber: '',
      mailId: '',
      gstPercentage: 18,
      roomPriceDiscount: 0
    });
    setIsEditing(null);
  };

  const handleEdit = (company: Company) => {
    setFormData({
      companyName: company.companyName,
      agentName: company.agentName,
      agentNumber: company.agentNumber,
      mailId: company.mailId,
      gstPercentage: company.gstPercentage,
      roomPriceDiscount: company.roomPriceDiscount
    });
    setIsEditing(company.id);
  };

  const handleDelete = (id: string) => {
    const updatedCompanies = companies.filter(company => company.id !== id);
    saveCompanies(updatedCompanies);
    toast({
      title: "Success",
      description: "Company deleted successfully"
    });
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      agentName: '',
      agentNumber: '',
      mailId: '',
      gstPercentage: 18,
      roomPriceDiscount: 0
    });
    setIsEditing(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Company / Marketplace Master</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Company' : 'Add New Company'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  value={formData.agentName}
                  onChange={e => setFormData({ ...formData, agentName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentNumber">Agent Number</Label>
                <Input
                  id="agentNumber"
                  value={formData.agentNumber}
                  onChange={e => setFormData({ ...formData, agentNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mailId">Email ID</Label>
                <Input
                  id="mailId"
                  type="email"
                  value={formData.mailId}
                  onChange={e => setFormData({ ...formData, mailId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
                <Input
                  id="gstPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.gstPercentage}
                  onChange={e => setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomPriceDiscount">Room Price Discount (%)</Label>
                <Input
                  id="roomPriceDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.roomPriceDiscount}
                  onChange={e => setFormData({ ...formData, roomPriceDiscount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit">
                {isEditing ? 'Update Company' : 'Add Company'}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Companies List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Company Name</th>
                  <th className="border border-gray-300 p-2 text-left">Agent Name</th>
                  <th className="border border-gray-300 p-2 text-left">Contact</th>
                  <th className="border border-gray-300 p-2 text-left">Email</th>
                  <th className="border border-gray-300 p-2 text-left">GST %</th>
                  <th className="border border-gray-300 p-2 text-left">Discount %</th>
                  <th className="border border-gray-300 p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td className="border border-gray-300 p-2">{company.companyName}</td>
                    <td className="border border-gray-300 p-2">{company.agentName}</td>
                    <td className="border border-gray-300 p-2">{company.agentNumber}</td>
                    <td className="border border-gray-300 p-2">{company.mailId}</td>
                    <td className="border border-gray-300 p-2">{company.gstPercentage}%</td>
                    <td className="border border-gray-300 p-2">{company.roomPriceDiscount}%</td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(company.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length === 0 && (
              <p className="text-center text-gray-500 py-4">No companies added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyMaster;
