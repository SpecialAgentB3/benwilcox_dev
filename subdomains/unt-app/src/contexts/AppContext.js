import React, { createContext, useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import Fuse from 'fuse.js';
import useDatabase from '../hooks/useDatabase';
import {
  fetchAllCourses,
  fetchAllCatalogForCourse,
  fetchAllOfferingsForCatalogIds,
  fetchAllCatalogForSearch
} from '../utils/dataUtils';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { db, loading: dbLoading } = useDatabase();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [semesterMapping, setSemesterMapping] = useState([]);

  // All Courses state
  const [allCourses, setAllCourses] = useState([]);
  const [mainCourseMap, setMainCourseMap] = useState(new Map());
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [fuse, setFuse] = useState(null);

  // Pinned Courses
  const [pinnedCourses, setPinnedCourses] = useState([]);

  // Course Display 1 State
  const [coursesInDisplay1, setCoursesInDisplay1] = useState([]);

  // Active Course State (for Display 2)
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeYears, setActiveYears] = useState([]);
  const [activeSemesters, setActiveSemesters] = useState([]);

  // UI Toggles
  const [autoPin, setAutoPin] = useState(true);
  const [showCourseGroups, setShowCourseGroups] = useState(false);
  const [granularView, setGranularView] = useState(false);
  const [showAllYears, setShowAllYears] = useState(true);
  const [showCourseCount, setShowCourseCount] = useState(true);

  // Course Group Selector State
  const [courseGroupSelection, setCourseGroupSelection] = useState({});

  // URL State Hydration
  const [initializationDone, setInitializationDone] = useState(false);

  // --- DATA LOADING ---
  useEffect(() => {
    // Load semester_mapping.csv
    Papa.parse('/semester_mapping.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        setSemesterMapping(results.data);
      },
    });
  }, []);

  useEffect(() => {
    if (db) {
      const initializeSearch = async () => {
        setLoadingMessage('Loading courses...');
        setLoadingProgress(25);
        // 1. Fetch all main courses and create a lookup map
        const courses = await fetchAllCourses(db);
        const courseMap = new Map();
        courses.forEach(course => {
          courseMap.set(course.main_course_id, course);
        });
        setAllCourses(courses);
        setFilteredCourses(courses);
        setMainCourseMap(courseMap);

        setLoadingMessage('Fetching catalog data...');
        setLoadingProgress(50);
        // 2. Fetch all unique catalog entries for searching
        const allCatalogForSearch = await fetchAllCatalogForSearch(db);

        setLoadingMessage('Building search index...');
        setLoadingProgress(75);
        // 3. Create the combined and pre-processed search index for Fuse.js
        const searchData = new Map();
        const processText = (text) => text.replace(/ - /g, ' ');

        // Add current course name/code combinations
        courses.forEach(c => {
            const searchText = processText(`${c.course_code} ${c.course_name}`);
            searchData.set(c.main_course_id, new Set([searchText]));
        });

        // Add historical course name/code combinations
        allCatalogForSearch.forEach(c => {
            const searchText = processText(`${c.course_code} ${c.course_name}`);
            if (searchData.has(c.main_course_id)) {
                searchData.get(c.main_course_id).add(searchText);
            } else {
                searchData.set(c.main_course_id, new Set([searchText]));
            }
        });

        // Convert the map to an array of objects for Fuse
        const searchIndex = Array.from(searchData.entries()).map(([id, strings]) => ({
            main_course_id: id,
            searchStrings: Array.from(strings)
        }));
        
        const fuseInstance = new Fuse(searchIndex, {
          keys: ['searchStrings'],
          includeScore: true,
          threshold: 0.1, // Stricter search to reduce fuzzy matches
          ignoreLocation: true,
          findAllMatches: true,
        });
        setFuse(fuseInstance);
        setLoadingProgress(100);
      };
      initializeSearch();
    }
  }, [db]);

  // --- URL STATE HYDRATION ---
  useEffect(() => {
    if (db && fuse && mainCourseMap.size > 0 && !initializationDone) {
      const params = new URLSearchParams(window.location.search);
      
      const settingsParam = params.get('settings');
      const pinnedParam = params.get('pinned');
      const coursesParam = params.get('courses');
      const activeParam = params.get('active');

      // 1. Handle settings from URL
      if (settingsParam) {
        const settingsInt = parseInt(settingsParam, 10);
        if (!isNaN(settingsInt)) {
          setAutoPin(!!(settingsInt & 1));
          setShowCourseGroups(!!(settingsInt & 2));
          setShowCourseCount(!!(settingsInt & 4));
          setShowAllYears(!!(settingsInt & 8));
          setGranularView(!!(settingsInt & 16));
        }
      }

      // 2. Handle pinned courses from URL
      if (pinnedParam) {
        const pinnedIds = pinnedParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        const coursesToPin = pinnedIds.map(id => mainCourseMap.get(id)).filter(Boolean);
        setPinnedCourses(coursesToPin);
      }
      
      // 3. Handle courses in display 1 from URL
      if (coursesParam) {
        const courseIds = coursesParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        const coursesToDisplay = courseIds.map(id => mainCourseMap.get(id)).filter(Boolean);
        setCoursesInDisplay1(coursesToDisplay);
      }
      
      // 4. Handle active course from URL
      if (activeParam) {
        const activeId = parseInt(activeParam, 10);
        if (!isNaN(activeId)) {
          const courseToActivate = mainCourseMap.get(activeId);
          if (courseToActivate) {
            setAsActiveCourse(courseToActivate);
          }
        }
      }
      
      setInitializationDone(true);
    }
  }, [db, fuse, mainCourseMap, initializationDone]);

  // --- SEARCH LOGIC ---
  const handleSearch = useCallback((term) => {
    if (!term) {
      setFilteredCourses(allCourses);
      return;
    }
    if (fuse) {
      const processedTerm = term.replace(/ - /g, ' ');
      const results = fuse.search(processedTerm);
      
      // Get unique main_course_ids from results
      const uniqueMainCourseIds = [...new Set(results.map(result => result.item.main_course_id))];

      // Map back to full MainCourse objects
      const matchedCourses = uniqueMainCourseIds
        .map(id => mainCourseMap.get(id))
        .filter(Boolean); // filter(Boolean) removes any undefined if a course isn't found

      setFilteredCourses(matchedCourses);
    }
  }, [fuse, allCourses, mainCourseMap]);


  // --- COURSE DISPLAY 1 LOGIC ---
  const addCourseToDisplay1 = (course) => {
    if (!coursesInDisplay1.find(c => c.main_course_id === course.main_course_id)) {
      setCoursesInDisplay1(prev => [...prev, course]);
      if (autoPin) {
        setPinnedCourses(prev => {
            const isPinned = prev.some(p => p.main_course_id === course.main_course_id);
            if (!isPinned) {
                return [...prev, course];
            }
            return prev;
        });
      }
      setAsActiveCourse(course);
    }
  };
  
  const removeCourseFromDisplay1 = (courseId) => {
      setCoursesInDisplay1(prev => prev.filter(c => c.main_course_id !== courseId));
      if(activeCourse && activeCourse.main_course_id === courseId) {
          setActiveCourse(null);
      }
  };

  const reorderCoursesInDisplay1 = (dragIndex, hoverIndex) => {
      const draggedCourse = coursesInDisplay1[dragIndex];
      const newCourses = [...coursesInDisplay1];
      newCourses.splice(dragIndex, 1);
      newCourses.splice(hoverIndex, 0, draggedCourse);
      setCoursesInDisplay1(newCourses);
  };


  // --- PINNING LOGIC ---
  const togglePin = (course) => {
    setPinnedCourses(prev => {
      const isPinned = prev.find(p => p.main_course_id === course.main_course_id);
      if (isPinned) {
        return prev.filter(p => p.main_course_id !== course.main_course_id);
      } else {
        return [...prev, course];
      }
    });
  };


  // --- ACTIVE COURSE LOGIC ---
  const setAsActiveCourse = useCallback(async (course, year = null, semester = null) => {
      setActiveCourse(course);
      if (db && course) {
          const allCatalog = await fetchAllCatalogForCourse(db, course.main_course_id);
          const allCatalogIds = allCatalog.map(c => c.main_catalog_id);
          const offerings = await fetchAllOfferingsForCatalogIds(db, allCatalogIds);

          const relevantYears = [...new Set(offerings.map(o => o.year))].sort((a,b) => b-a);
          const relevantSemesters = [...new Set(offerings.map(o => o.specific_semester))];

          setActiveYears(year ? [year] : relevantYears);
          setActiveSemesters(semester ? (Array.isArray(semester) ? semester : [semester]) : relevantSemesters);
      } else {
          setActiveYears([]);
          setActiveSemesters([]);
      }
  }, [db]);


  const value = {
    db,
    dbLoading,
    loadingProgress,
    loadingMessage,
    semesterMapping,
    allCourses,
    filteredCourses,
    handleSearch,
    pinnedCourses,
    togglePin,
    coursesInDisplay1,
    addCourseToDisplay1,
    removeCourseFromDisplay1,
    reorderCoursesInDisplay1,
    activeCourse,
    setAsActiveCourse,
    activeYears,
    setActiveYears,
    activeSemesters,
    setActiveSemesters,
    autoPin,
    setAutoPin,
    showCourseGroups,
    setShowCourseGroups,
    granularView,
    setGranularView,
    showAllYears,
    setShowAllYears,

    showCourseCount,
    setShowCourseCount,
    courseGroupSelection,
    setCourseGroupSelection,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
