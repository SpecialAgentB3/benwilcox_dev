import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { fetchAllCatalogForCourse, fetchAllOfferingsForCatalogIds } from '../../utils/dataUtils';
import Checkbox from '../shared/Checkbox';

const SemesterSpecifier = () => {
    const { db, activeCourse, activeSemesters, setActiveSemesters, semesterMapping, courseGroupSelection } = useContext(AppContext);
    const [allRelevantSemesters, setAllRelevantSemesters] = useState([]);
    const semesterContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    
    useEffect(() => {
        if(db && activeCourse) {
            const getSemesters = async () => {
                const catalogs = await fetchAllCatalogForCourse(db, activeCourse.main_course_id);
                const selectedCatalogs = catalogs.filter(c => courseGroupSelection[c.main_catalog_id] !== false);
                const catalogIds = selectedCatalogs.map(c => c.main_catalog_id);
                
                if (catalogIds.length > 0) {
                    const offerings = await fetchAllOfferingsForCatalogIds(db, catalogIds);
                    const semesters = [...new Set(offerings.map(o => o.specific_semester))];
                    
                    const sorted = semesters.sort((a,b) => {
                        const mappingA = semesterMapping.find(m => m['Specific Semester'] === a);
                        const mappingB = semesterMapping.find(m => m['Specific Semester'] === b);
                        
                        // If mappings are not found, put them at the end
                        if (!mappingA && !mappingB) return 0;
                        if (!mappingA) return 1;
                        if (!mappingB) return -1;

                        return mappingA['Semester Order'] - mappingB['Semester Order'];
                    });

                    setAllRelevantSemesters(sorted);
                } else {
                    setAllRelevantSemesters([]);
                }
            }
            getSemesters();
        } else {
            setAllRelevantSemesters([]);
        }
    }, [db, activeCourse, semesterMapping, courseGroupSelection]);

    const handleSemesterChange = (semester) => {
        setActiveSemesters(prev => {
            if(prev.includes(semester)){
                return prev.filter(s => s !== semester);
            } else {
                return [...prev, semester];
            }
        });
    };

    const handleSelectionEnd = useCallback(() => {
        if (!isDragging) return;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
            const range = selection.getRangeAt(0);
            const container = semesterContainerRef.current;
            const selectedItems = new Set();
    
            if (container) {
                for (const child of container.children) {
                    if (range.intersectsNode(child)) {
                        const semester = child.querySelector('label').textContent;
                        selectedItems.add(semester);
                    }
                }
            }
            
            if (selectedItems.size > 0) {
                setActiveSemesters(Array.from(selectedItems));
            }
        }
        if (selection) {
            selection.removeAllRanges();
        }
        setIsDragging(false);
    }, [isDragging, setActiveSemesters]);

    const handleToggleAll = () => {
        if (activeSemesters.length > 0) {
            setActiveSemesters([]);
        } else {
            setActiveSemesters(allRelevantSemesters);
        }
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleSelectionEnd);
        return () => window.removeEventListener('mouseup', handleSelectionEnd);
    }, [handleSelectionEnd]);

    return (
        <div className="specifier-box">
            <h4 onClick={handleToggleAll} style={{ cursor: 'pointer' }}>Semesters</h4>
            <div className="specifier-list" ref={semesterContainerRef} onMouseDown={() => setIsDragging(true)}>
                {allRelevantSemesters.map(semester => (
                     <Checkbox
                        key={semester}
                        id={`sem-${semester}`}
                        label={semester}
                        checked={activeSemesters.includes(semester)}
                        onChange={() => handleSemesterChange(semester)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SemesterSpecifier;
