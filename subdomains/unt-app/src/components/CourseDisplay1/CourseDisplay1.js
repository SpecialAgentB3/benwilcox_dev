// src/components/CourseDisplay1/CourseDisplay1.js
import React, { useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import CourseRow from './CourseRow';
import SemesterViewHeader from './SemesterView/SemesterViewHeader';
import './CourseDisplay1.css';

const CourseDisplay1 = () => {
    const { coursesInDisplay1, reorderCoursesInDisplay1 } = useContext(AppContext);
    const containerRef = useRef(null);

    useEffect(() => {
        const element = containerRef.current;
        if (element) {
            const handleWheel = (e) => {
                const isSemesterArea = e.target.closest('.semester-view-container, .semester-view-header-years');
                if (isSemesterArea) {
                    if (e.deltaY === 0) return;
                    e.preventDefault();
                    element.scrollLeft += e.deltaY + e.deltaX;
                }
            };
            element.addEventListener('wheel', handleWheel, { passive: false });
            return () => element.removeEventListener('wheel', handleWheel);
        }
    }, []);

    return (
        <div className="course-display1-container" ref={containerRef}>
            <SemesterViewHeader />
            <div className="course-display1-list">
                {coursesInDisplay1.map((course, index) => (
                    <CourseRow
                        key={course.main_course_id}
                        index={index}
                        course={course}
                        moveRow={reorderCoursesInDisplay1}
                    />
                ))}
                {coursesInDisplay1.length === 0 && (
                    <div className="course-display1-empty-message">
                        Click on a course to add it to the timeline.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDisplay1;