import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { fetchAllCatalogForCourse, fetchAllOfferingsForCatalogIds } from '../../utils/dataUtils';
import { sortOfferings } from '../../utils/sortingUtils';
import CourseCell from './CourseCell';

const SpecificCoursesDisplay = () => {
    const { db, activeCourse, activeYears, activeSemesters, semesterMapping, courseGroupSelection } = useContext(AppContext);
    const [offerings, setOfferings] = useState([]);

    useEffect(() => {
        if (db && activeCourse && activeYears.length > 0 && activeSemesters.length > 0) {
            const getOfferings = async () => {
                const catalogs = await fetchAllCatalogForCourse(db, activeCourse.main_course_id);
                const selectedCatalogIds = catalogs
                    .filter(c => courseGroupSelection[c.main_catalog_id] !== false)
                    .map(c => c.main_catalog_id);

                if (selectedCatalogIds.length > 0) {
                    const allOfferings = await fetchAllOfferingsForCatalogIds(db, selectedCatalogIds);
                    
                    const filtered = allOfferings.filter(o => 
                        activeYears.includes(o.year) && activeSemesters.includes(o.specific_semester)
                    );

                    const sorted = sortOfferings(filtered, semesterMapping);
                    
                    setOfferings(sorted);
                } else {
                    setOfferings([]);
                }
            };
            getOfferings();
        } else {
            setOfferings([]);
        }
    }, [db, activeCourse, activeYears, activeSemesters, semesterMapping, courseGroupSelection]);

    if (offerings.length === 0) {
        return (
            <div style={{ width: '100%', textAlign: 'center', color: '#8c8c8c' }}>
                No offerings match the current filters.
            </div>
        );
    }

    return (
        <>
            {offerings.map(offering => (
                <CourseCell key={offering.main_offer_id} offering={offering} />
            ))}
        </>
    );
};

export default SpecificCoursesDisplay;
