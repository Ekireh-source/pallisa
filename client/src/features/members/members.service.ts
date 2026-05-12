import api from "@/lib/api";

export const FetchClasses = async (params?: any) => {
  try {
    const res = await api.get(`/members/classes/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchClassById = async (id: number | string) => {
  try {
    const res = await api.get(`/members/classes/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateClass = async (data: any) => {
  try {
    const res = await api.post(`/members/classes/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateClass = async (id: number | string, data: any) => {
  try {
    const res = await api.put(`/members/classes/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteClass = async (id: number | string) => {
  try {
    const res = await api.delete(`/members/classes/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchSubjects = async (params?: any) => {
  try {
    const res = await api.get(`/members/subjects/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchSubjectById = async (id: number | string) => {
  try {
    const res = await api.get(`/members/subjects/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateSubject = async (data: any) => {
  try {
    const res = await api.post(`/members/subjects/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateSubject = async (id: number | string, data: any) => {
  try {
    const res = await api.put(`/members/subjects/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteSubject = async (id: number | string) => {
  try {
    const res = await api.delete(`/members/subjects/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchStreams = async (params?: any) => {
  try {
    const res = await api.get(`/members/streams/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchStreamById = async (id: number | string) => {
  try {
    const res = await api.get(`/members/streams/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateStream = async (data: any) => {
  try {
    const res = await api.post(`/members/streams/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateStream = async (id: number | string, data: any) => {
  try {
    const res = await api.put(`/members/streams/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteStream = async (id: number | string) => {
  try {
    const res = await api.delete(`/members/streams/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchAcademicYears = async (params?: any) => {
  try {
    const res = await api.get(`/expenses/academic-years/`, params);
    
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchAcademicYearById = async (id: number | string) => {
  try {
    const res = await api.get(`/expenses/academic-years/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateAcademicYear = async (data: any) => {
  try {
    const res = await api.post(`/expenses/academic-years/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateAcademicYear = async (id: number | string, data: any) => {
  try {
    const res = await api.put(`/expenses/academic-years/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteAcademicYear = async (id: number | string) => {
  try {
    const res = await api.delete(`/expenses/academic-years/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchTerms = async (params?: any) => {
  try {
    const res = await api.get(`/expenses/terms/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchTermById = async (id: number | string) => {
  try {
    const res = await api.get(`/expenses/terms/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateTerm = async (data: any) => {
  try {
    const res = await api.post(`/expenses/terms/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateTerm = async (id: number | string, data: any) => {
  try {
    const res = await api.put(`/expenses/terms/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteTerm = async (id: number | string) => {
  try {
    const res = await api.delete(`/expenses/terms/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchTeachers = async (params?: any) => {
  try {
    const res = await api.get(`/members/teachers/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchTeacherById = async (id: number | string) => {
  try {
    const res = await api.get(`/members/teachers/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateTeacher = async (data: any) => {
  try {
    const res = await api.post(`/members/teachers/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateTeacher = async (id: number | string, data: any) => {
  try {
    const res = await api.put(`/members/teachers/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteTeacher = async (id: number | string) => {
  try {
    const res = await api.delete(`/members/teachers/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchStudents = async (params?: any) => {
  try {
    const res = await api.get(`/members/students/`, params);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const FetchStudentById = async (id: number | string) => {
  try {
    const res = await api.get(`/members/students/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const CreateStudent = async (data: any) => {
  try {
    const res = await api.post(`/members/students/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const UpdateStudent = async (id: number | string, data: any) => {
  try {
    const res = await api.put(`/members/students/${id}/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const DeleteStudent = async (id: number | string) => {
  try {
    const res = await api.delete(`/members/students/${id}/`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const BulkUploadStudents = async (data: { students: any[] }) => {
  try {
    const res = await api.post(`/members/students/bulk-upload/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};

export const BulkUploadTeachers = async (data: { teachers: any[] }) => {
  try {
    const res = await api.post(`/members/teachers/bulk-upload/`, data);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
};


