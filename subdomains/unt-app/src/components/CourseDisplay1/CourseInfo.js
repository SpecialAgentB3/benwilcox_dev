import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { FaTrash } from 'react-icons/fa';

const CourseInfo = ({ course }) => {
    const { setAsActiveCourse, activeCourse, removeCourseFromDisplay1 } = useContext(AppContext);
    const isSelected = activeCourse && activeCourse.main_course_id === course.main_course_id;

    const handleClick = () => {
        if(isSelected) {
            setAsActiveCourse(null);
        } else {
            setAsActiveCourse(course);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        removeCourseFromDisplay1(course.main_course_id);
    }

    return (
        <div 
            className="course-info"
            onClick={handleClick}
        >
             <button 
                onClick={handleDelete}
                className="delete-row-button"
                aria-label="Delete Row"
            >
                <FaTrash />
            </button>
            <div>
                <h3 className="course-info-code">{course.course_code}</h3>
                <p className="course-info-name">{course.course_name}</p>
            </div>
        </div>
    );
};

export default CourseInfo;
