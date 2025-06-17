// src/App.js
import React, { useContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppContext } from './contexts/AppContext';

import Header from './components/shared/Header';
import CourseSelector from './components/CourseSelector/CourseSelector';
import CourseDisplay1 from './components/CourseDisplay1/CourseDisplay1';
import CourseDisplay2 from './components/CourseDisplay2/CourseDisplay2';
import CourseDetails from './components/CourseDetails/CourseDetails';

import './App.css';

function App() {
  const { dbLoading } = useContext(AppContext);

  if (dbLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2rem' }}>
        Loading Database...
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="app-container">
        <div className="header-area">
          <Header />
        </div>
        <div className="left-pane">
          <div className="course-selector-area">
            <CourseSelector />
          </div>
          <div className="course-details-area">
            <CourseDetails />
          </div>
        </div>
        <div className="course-display1-area">
          <CourseDisplay1 />
        </div>
        <div className="course-display2-area">
          <CourseDisplay2 />
        </div>
      </main>
    </DndProvider>
  );
}

export default App;