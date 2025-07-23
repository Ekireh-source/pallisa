'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchNonStaffMembers, deleteNonStaffMember } from '@/store/slices/memberNonStaffSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function NonStaffMembersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { nonStaffMembers, loading, error } = useAppSelector((state) => state.memberNonStaff);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchNonStaffMembers({}));
  }, [dispatch]);

  const handleSearch = () => {
    const filters: Record<string, string> = {};
    if (searchTerm) filters.search = searchTerm;
    if (employmentTypeFilter && employmentTypeFilter !== 'all') filters.employment_type = employmentTypeFilter;
    dispatch(fetchNonStaffMembers(filters));
  };

  const handleDelete = (id: number) => {
    setMemberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      await dispatch(deleteNonStaffMember(memberToDelete));
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    const colors = {
      full_time: 'bg-green-100 text-green-800',
      part_time: 'bg-blue-100 text-blue-800',
      contract: 'bg-yellow-100 text-yellow-800',
      temporary: 'bg-orange-100 text-orange-800',
      volunteer: 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Non-Staff Members</h1>
        <Link href="/members/non-staff-members/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Non-Staff Member
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, employee ID, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Non-Staff Members ({nonStaffMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Employee ID</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Employment Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Specialization</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Salary</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Hire Date</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nonStaffMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium">{member.employee_id}</td>
                      <td className="border border-gray-200 px-4 py-2">{member.full_name || 'Unknown'}</td>
                      <td className="border border-gray-200 px-4 py-2">
                        <Badge className={getEmploymentTypeBadge(member.employment_type)}>
                          {member.employment_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">{member.specialization || '-'}</td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span>Salary: UGX {member.salary ? Number(member.salary).toLocaleString() : '-'}</span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {member.hire_date ? format(new Date(member.hire_date), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/members/non-staff-members/${member.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/members/non-staff-members/${member.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(member.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Non-Staff Member</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this non-staff member? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 