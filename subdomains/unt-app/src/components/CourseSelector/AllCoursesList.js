import React, { useContext, useMemo, useRef, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import CourseItem from './CourseItem';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const AllCoursesList = () => {
    const { filteredCourses, pinnedCourses } = useContext(AppContext);
    const listRef = useRef(null);

    const items = useMemo(() => {
        const pinnedCourseIds = new Set(pinnedCourses.map(c => c.main_course_id));
        const unpinnedFiltered = filteredCourses.filter(c => !pinnedCourseIds.has(c.main_course_id));
    
        const combined = [];
        if (pinnedCourses.length > 0) {
          combined.push({ type: 'header', label: 'Pinned Courses' });
          combined.push(...pinnedCourses.map(c => ({ type: 'course', data: c })));
          combined.push({ type: 'separator' });
        }
        combined.push(...unpinnedFiltered.map(c => ({ type: 'course', data: c })));
    
        return combined;
      }, [filteredCourses, pinnedCourses]);
    
      const getItemSize = index => {
        const item = items[index];
        if (item.type === 'header') return 30; // Height for header
        if (item.type === 'separator') return 10; // Height for separator
        return 40; // Height for course item
      };
    
      const Row = ({ index, style }) => {
        const item = items[index];
        if (item.type === 'header') {
          const adjustedStyle = { ...style, top: `${parseInt(style.top, 10) - 15}px` };
          return (
            <div style={adjustedStyle}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 pt-4">
                {item.label}
              </h3>
            </div>
          );
        }
        if (item.type === 'separator') {
          return (
            <div style={style}>
              <hr className="my-1 border-gray-400" />
            </div>
          );
        }
        return (
          <div style={style}>
            <CourseItem course={item.data} />
          </div>
        );
      };

    useEffect(() => {
        if(listRef.current){
            // reset cache so rows are re-measured and re-rendered when data shape changes
            listRef.current.resetAfterIndex(0, true);
        }
    }, [items]);

    return (
        <div className="all-courses-list">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        itemCount={items.length}
                        itemSize={getItemSize}
                        width={width}
                        overscanCount={50}
                        itemKey={(index, data) => {
                            const item = items[index];
                            if(item.type === 'course') return `course-${item.data.main_course_id}`;
                            if(item.type === 'header') return `header-${item.label}`;
                            return `separator-${index}`;
                        }}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
};

export default AllCoursesList;

