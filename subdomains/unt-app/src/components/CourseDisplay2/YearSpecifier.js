import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import Checkbox from '../shared/Checkbox';

const YearSpecifier = () => {
    const { activeCourse, activeYears, setActiveYears, courseGroupSelection } = useContext(AppContext);
    const [allRelevantYears, setAllRelevantYears] = useState([]);
    const yearContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (activeCourse && activeCourse.offerings) {
            const getYears = () => {
                const catalogs = activeCourse.catalog || [];
                const selectedCatalogs = catalogs.filter(c => courseGroupSelection[c.main_catalog_id] !== false);
                const catalogIds = new Set(selectedCatalogs.map(c => c.main_catalog_id));

                if (catalogIds.size > 0) {
                    const offerings = activeCourse.offerings.filter(o => catalogIds.has(o.main_catalog_id));
                    const years = [...new Set(offerings.map(o => o.year))].sort((a,b) => b-a);
                    setAllRelevantYears(years);
                } else {
                    setAllRelevantYears([]);
                }
            }
            getYears();
        } else {
            setAllRelevantYears([]);
        }
    }, [activeCourse, courseGroupSelection]);
    
    const handleYearChange = (year) => {
        setActiveYears(prev => {
            if(prev.includes(year)){
                return prev.filter(y => y !== year);
            } else {
                return [...prev, year];
            }
        });
    };

    const handleSelectionEnd = useCallback(() => {
        if (!isDragging) return;
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
            const range = selection.getRangeAt(0);
            const container = yearContainerRef.current;
            const selectedItems = new Set();
    
            if (container) {
                for (const child of container.children) {
                    if (range.intersectsNode(child)) {
                        const year = parseInt(child.querySelector('label').textContent, 10);
                        selectedItems.add(year);
                    }
                }
            }
            
            if (selectedItems.size > 0) {
                setActiveYears(Array.from(selectedItems));
            }
        }
        if (selection) {
            selection.removeAllRanges();
        }
        setIsDragging(false);
    }, [isDragging, setActiveYears]);

    const handleToggleAll = () => {
        if (activeYears.length > 0) {
            setActiveYears([]);
        } else {
            setActiveYears(allRelevantYears);
        }
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleSelectionEnd);
        return () => window.removeEventListener('mouseup', handleSelectionEnd);
    }, [handleSelectionEnd]);

    return (
        <div className="specifier-box">
            <h4 onClick={handleToggleAll} style={{ cursor: 'pointer' }}>Years</h4>
            <div className="specifier-list" ref={yearContainerRef} onMouseDown={() => setIsDragging(true)}>
                {allRelevantYears.map(year => (
                    <Checkbox
                        key={year}
                        id={`year-${year}`}
                        label={year}
                        checked={activeYears.includes(year)}
                        onChange={() => handleYearChange(year)}
                    />
                ))}
            </div>
        </div>
    );
};

export default YearSpecifier;
