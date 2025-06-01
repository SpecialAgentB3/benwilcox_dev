import React from 'react';
import {BrowserRouter as Router, Routes, Route, Link} from 'react';
import CoursesPage from './pages/CoursesPage';
import HomePage from './pages/HomePage';

function App(){
    return(
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />

            </Routes>
        </Router>
    );
}

export default App;