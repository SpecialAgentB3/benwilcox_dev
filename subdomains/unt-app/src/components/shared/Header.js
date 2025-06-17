import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { FiShare2 } from 'react-icons/fi';
import './Header.css';

const Header = () => {
    const { 
        autoPin,
        showCourseGroups,
        showCourseCount,
        showAllYears,
        granularView,
        pinnedCourses,
        coursesInDisplay1,
        activeCourse
    } = useContext(AppContext);
    
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        const params = new URLSearchParams();
        const baseUrl = 'https://unt.benwilcox.dev/';

        // --- Determine Default State ---
        const defaultSettings = {
            autoPin: true,
            showCourseGroups: false,
            showCourseCount: true,
            showAllYears: true,
            granularView: false,
        };
        const defaultSettingsInt = (defaultSettings.autoPin ? 1 : 0) |
                                   (defaultSettings.showCourseGroups ? 2 : 0) |
                                   (defaultSettings.showCourseCount ? 4 : 0) |
                                   (defaultSettings.showAllYears ? 8 : 0) |
                                   (defaultSettings.granularView ? 16 : 0);

        // --- Compare Current State to Default and Build URL ---
        // 1. Settings
        const currentSettingsInt = (autoPin ? 1 : 0) |
                                   (showCourseGroups ? 2 : 0) |
                                   (showCourseCount ? 4 : 0) |
                                   (showAllYears ? 8 : 0) |
                                   (granularView ? 16 : 0);

        if (currentSettingsInt !== defaultSettingsInt) {
            params.set('settings', currentSettingsInt);
        }

        // 2. Pinned Courses
        if (pinnedCourses.length > 0) {
            params.set('pinned', pinnedCourses.map(c => c.main_course_id).join(','));
        }

        // 3. Displayed Courses
        if (coursesInDisplay1.length > 0) {
            params.set('courses', coursesInDisplay1.map(c => c.main_course_id).join(','));
        }

        // 4. Active Course
        if (activeCourse) {
            params.set('active', activeCourse.main_course_id);
        }

        const queryString = params.toString();
        const shareUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

        navigator.clipboard.writeText(shareUrl);
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="header-container">
            <div className="header-section left">
                <div>
                    Created by <a href="https://www.linkedin.com/in/benwilcox2005/" target="_blank" rel="noopener noreferrer">Benjamin Wilcox</a>
                    <br />
                    Updated 6/14/2025
                </div>
            </div>
            <div className="header-section middle">
                UNT Historical Courses
            </div>
            <div className="header-section right">
                <a href="https://github.com/BenWilcox8/UNT-Course-Catalog-App?tab=readme-ov-file#information" target="_blank" rel="noopener noreferrer">Information</a>
                <a href="/courses.db" download>Download Data</a>
                <button onClick={handleShare} className="share-button-header" title="Copy Share Link">
                    {copied ? 'Copied!' : 'Share'} <FiShare2 />
                </button>
            </div>
        </div>
    );
};

export default Header;