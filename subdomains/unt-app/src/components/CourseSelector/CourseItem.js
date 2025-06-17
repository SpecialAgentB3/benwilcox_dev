import React, { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { FaThumbtack } from 'react-icons/fa';

const CourseItem = ({ course }) => {
  const { addCourseToDisplay1, togglePin, pinnedCourses } = useContext(AppContext);
  const [isHovered, setIsHovered] = useState(false);
  const [pinHovered, setPinHovered] = useState(false);
  const isPinned = pinnedCourses.some(p => p.main_course_id === course.main_course_id);

  const handleCourseClick = () => {
    addCourseToDisplay1(course);
  };

  const handlePinClick = (e) => {
    e.stopPropagation(); // Prevent course click event
    togglePin(course);
  };

  return (
    <li
      className={`course-item ${isHovered && !pinHovered ? 'hover-highlight' : ''}`}
      onClick={handleCourseClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        <span className="course-item-text">
            <strong>{course.course_code}</strong> - {course.course_name}
        </span>
        {(isHovered || isPinned) && (
            <button
                onClick={handlePinClick}
                onMouseEnter={() => setPinHovered(true)}
                onMouseLeave={() => setPinHovered(false)}
                className="pin-button"
                aria-label={isPinned ? 'Unpin course' : 'Pin course'}
            >
                <FaThumbtack className={`pin-icon ${isPinned ? 'pinned' : ''}`} />
            </button>
        )}
    </li>
  );
};

export default CourseItem;
