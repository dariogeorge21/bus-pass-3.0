"use client";

import React, { createContext, useContext, useState } from 'react';

interface StudentContextProps {
  studentName: string;
  admissionNumber: string;
  setStudentName: (name: string) => void;
  setAdmissionNumber: (number: string) => void;
}

const StudentContext = createContext<StudentContextProps | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studentName, setStudentName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');

  return (
    <StudentContext.Provider value={{ studentName, admissionNumber, setStudentName, setAdmissionNumber }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextProps => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
