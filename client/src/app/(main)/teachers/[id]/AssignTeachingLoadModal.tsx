import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  Button, 
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { 
  FetchSubjects, 
  FetchStreams, 
  FetchAcademicYears, 
  CreateTeacherSubjectAssignment 
} from '@/features/members/members.service';
import { toast } from 'sonner';

interface AssignTeachingLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  onSuccess: () => void;
}

export function AssignTeachingLoadModal({ isOpen, onClose, teacherId, onSuccess }: AssignTeachingLoadModalProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    try {
      const [subjectsRes, streamsRes, yearsRes] = await Promise.all([
        FetchSubjects({ limit: 100 }),
        FetchStreams({ limit: 100 }),
        FetchAcademicYears({ limit: 100 })
      ]);
      
      if (!('error' in subjectsRes) && subjectsRes.results) setSubjects(subjectsRes.results);
      if (!('error' in streamsRes) && streamsRes.results) setStreams(streamsRes.results);
      if (!('error' in yearsRes) && yearsRes.results) {
        setAcademicYears(yearsRes.results);
        // Default to the first active year if available
        const activeYear = yearsRes.results.find((y: any) => y.is_active);
        if (activeYear) {
          setSelectedYear(activeYear.id.toString());
        } else if (yearsRes.results.length > 0) {
          setSelectedYear(yearsRes.results[0].id.toString());
        }
      }
    } catch (error) {
      toast.error('Failed to load form data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedStream || !selectedYear) {
      toast.error('Please select all fields');
      return;
    }

    setLoading(true);
    const res = await CreateTeacherSubjectAssignment({
      teacher: parseInt(teacherId, 10),
      subject: parseInt(selectedSubject, 10),
      stream: parseInt(selectedStream, 10),
      academic_year: parseInt(selectedYear, 10),
    });
    setLoading(false);

    if (res.success) {
      toast.success('Teaching load assigned successfully');
      setSelectedSubject('');
      setSelectedStream('');
      onSuccess();
      onClose();
    } else {
      toast.error('Failed to assign teaching load');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Subject/Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class / Stream</Label>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id.toString()}>
                      {stream.class_obj_name ? `${stream.class_obj_name} - ` : ''}{stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
