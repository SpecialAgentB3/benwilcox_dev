import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../../contexts/AppContext';

const SemesterBar = ({ course, year, broadSemester, offeringsForSemester, specificSemesterTypes }) => {
    const { 
        granularView, 
        showCourseCount,
        setAsActiveCourse 
    } = useContext(AppContext);

    const offeredSpecificSemesters = useMemo(() => {
        return new Set(offeringsForSemester.map(o => o.specific_semester));
    }, [offeringsForSemester]);
    
    const handleBroadClick = () => {
        setAsActiveCourse(course, year, specificSemesterTypes);
    };

    const handleSpecificClick = (e, specificSemester) => {
        e.stopPropagation();
        setAsActiveCourse(course, year, specificSemester);
    };

    const renderGranularView = () => {
        const barTypes = specificSemesterTypes.length > 0 ? specificSemesterTypes : [broadSemester];
        return (
            <div className="granular-view-container" onClick={handleBroadClick}>
                {barTypes.map(specificType => {
                    const isOffered = offeredSpecificSemesters.has(specificType);
                    const offeringCount = isOffered ? offeringsForSemester.filter(o => o.specific_semester === specificType).length : 0;
                    const filledClass = isOffered ? 'filled' : '';
                    
                    return (
                        <div 
                            key={specificType} 
                            className={`specific-semester-bar ${broadSemester.toLowerCase()} ${filledClass}`}
                            title={`${specificType} (${offeringCount} offerings)`}
                            onClick={(e) => handleSpecificClick(e, specificType)}
                        >
                            {showCourseCount && offeringCount > 0 && <span>{offeringCount}</span>}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderBroadView = () => {
        const isOffered = offeringsForSemester && offeringsForSemester.length > 0;
        const offeringCount = isOffered ? offeringsForSemester.length : 0;
        const filledClass = isOffered ? 'filled' : '';

        return (
            <div 
                className={`semester-bar ${broadSemester.toLowerCase()} ${filledClass}`}
                onClick={handleBroadClick}
                title={`${broadSemester} ${year} (${offeringCount} offerings)`}
            >
                {showCourseCount && offeringCount > 0 && <span>{offeringCount}</span>}
            </div>
        );
    };

    return (
        <div className="semester-bar-wrapper">
            {granularView ? renderGranularView() : renderBroadView()}
        </div>
    );
};

export default SemesterBar;
