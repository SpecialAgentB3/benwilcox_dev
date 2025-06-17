// src/components/CourseDisplay2/CourseDisplay2.js
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import YearSpecifier from './YearSpecifier';
import SemesterSpecifier from './SemesterSpecifier';
import SpecificCoursesDisplay from './SpecificCoursesDisplay';
import './CourseDisplay2.css';

const CourseDisplay2 = () => {
  const { activeCourse } = useContext(AppContext);

  if (!activeCourse) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#bfbfbf' }}>
        Select a course to see details.
      </div>
    );
  }

  return (
    <div className="course-display2-wrapper">
      <div className="specifiers-section">
        <YearSpecifier />
        <SemesterSpecifier />
      </div>
      <div className="specific-courses-display">
        <SpecificCoursesDisplay />
      </div>
    </div>
  );
};

export default CourseDisplay2;