import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { fetchFacultyById, fetchCatalogById } from '../../utils/dataUtils';

const CourseCell = ({ offering }) => {
    const { db } = useContext(AppContext);
    const [faculty, setFaculty] = useState(null);
    const [catalog, setCatalog] = useState(null);

    useEffect(() => {
        if(db && offering.main_faculty_id) {
            fetchFacultyById(db, offering.main_faculty_id).then(setFaculty);
        } else {
            setFaculty(null);
        }

        if (db && offering.main_catalog_id) {
            fetchCatalogById(db, offering.main_catalog_id).then(setCatalog);
        } else {
            setCatalog(null);
        }
    }, [db, offering]);

    return (
        <div className="course-cell">
            <div>
                {faculty ? (
                    <a href={faculty.faculty_link} target="_blank" rel="noopener noreferrer" className="faculty-name">
                        {faculty.faculty_name}
                    </a>
                ) : (
                    <p className="faculty-name">Staff</p>
                )}
            </div>
            <div>
                <div className="semester-year-info">{offering.specific_semester} {offering.year}</div>
                <a href={offering.link_to_highlight} target="_blank" rel="noopener noreferrer" className="course-name-link">
                    {offering.full_course_name}
                </a>
            </div>
            {catalog && (
                <div className="course-cell-name">{catalog.course_name}</div>
            )}
        </div>
    );
};

export default CourseCell;
