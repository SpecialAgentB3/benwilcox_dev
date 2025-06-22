import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext';
import Checkbox from '../shared/Checkbox';

const SemesterSpecifier = () => {
    const { activeCourse, activeSemesters, setActiveSemesters, courseGroupSelection, semesterMapping } = useContext(AppContext);
    const [allRelevantSemesters, setAllRelevantSemesters] = useState([]);
    const semesterContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (activeCourse && activeCourse.offerings && semesterMapping.length > 0) {
            const getSemesters = () => {
                const catalogs = activeCourse.catalog || [];
                const selectedCatalogs = catalogs.filter(c => courseGroupSelection[c.main_catalog_id] !== false);
                const catalogIds = new Set(selectedCatalogs.map(c => c.main_catalog_id));

                if (catalogIds.size > 0) {
                    const offerings = activeCourse.offerings.filter(o => catalogIds.has(o.main_catalog_id));
                    const specificSemesters = [...new Set(offerings.map(o => o.specific_semester))];
                    
                    const semesterOrderMap = new Map(
                        semesterMapping.map(s => [s.specific_semester, s['Semester Order']])
                    );

                    specificSemesters.sort((a, b) => {
                        return (semesterOrderMap.get(a) || 0) - (semesterOrderMap.get(b) || 0);
                    });

                    setAllRelevantSemesters(specificSemesters);
                } else {
                    setAllRelevantSemesters([]);
                }
            };
            getSemesters();
        } else {
            setAllRelevantSemesters([]);
        }
    }, [activeCourse, courseGroupSelection, semesterMapping]);

    const handleSemesterChange = (semester) => {
        setActiveSemesters(prev => {
            if (prev.includes(semester)) {
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
                        id={`semester-${semester}`}
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
