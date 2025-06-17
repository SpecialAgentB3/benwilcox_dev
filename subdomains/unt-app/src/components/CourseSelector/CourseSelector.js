// src/components/CourseSelector/CourseSelector.js
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import SearchCourses from './SearchCourses';
import AllCoursesList from './AllCoursesList';
import CourseGroupSelector from './CourseGroupSelector';
import Checkbox from '../shared/Checkbox';
import './CourseSelector.css';

const CourseSelector = () => {
  const { autoPin, setAutoPin, showCourseGroups, setShowCourseGroups } = useContext(AppContext);

  return (
    <div className="course-selector-container">
      <div className="course-selector-toggles">
        <Checkbox
          id="auto-pin"
          label="Auto Pin Courses"
          checked={autoPin}
          onChange={(e) => setAutoPin(e.target.checked)}
        />
        <button 
          onClick={() => setShowCourseGroups(!showCourseGroups)}
          className="show-groups-button"
        >
          {showCourseGroups ? 'Show Course List' : 'Show Course Group Selector'}
        </button>
      </div>

      <div style={{ display: showCourseGroups ? 'none' : 'block' }}>
        <SearchCourses />
      </div>

      {showCourseGroups ? (
        <div className="courses-list-container">
          <CourseGroupSelector />
        </div>
      ) : (
        <div className="courses-list-container">
          <AllCoursesList />
        </div>
      )}
    </div>
  );
};

export default CourseSelector;