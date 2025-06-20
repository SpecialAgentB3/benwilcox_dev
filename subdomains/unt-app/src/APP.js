// src/App.js
import React, { useContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { AppContext } from './contexts/AppContext';

import Header from './components/shared/Header';
import ProgressBar from './components/shared/ProgressBar';
import CourseSelector from './components/CourseSelector/CourseSelector';
import CourseDisplay1 from './components/CourseDisplay1/CourseDisplay1';
import CourseDisplay2 from './components/CourseDisplay2/CourseDisplay2';
import CourseDetails from './components/CourseDetails/CourseDetails';

import './App.css';

function App() {
  const { dbLoading, loadingProgress, loadingMessage } = useContext(AppContext);

  if (dbLoading) {
    return (
      <div className="loading-container">
        <h1>Loading Database...</h1>
        <ProgressBar progress={loadingProgress} message={loadingMessage} />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <PanelGroup direction="horizontal" className="main-group" autoSaveId="layout-h">
          {/* LEFT SIDE */}
          <Panel defaultSize={25} minSize={15} collapsible className="pane left-pane">
            <PanelGroup direction="vertical" autoSaveId="left-v" className="sub-group">
              <Panel defaultSize={60} minSize={20} collapsible className="panel-content">
                <CourseSelector />
              </Panel>
              <PanelResizeHandle className="handle-horizontal" />
              <Panel minSize={20} collapsible className="panel-content">
                <CourseDetails />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="handle-vertical" />

          {/* RIGHT SIDE */}
          <Panel minSize={30} collapsible className="pane right-pane">
            <Header />
            <PanelGroup direction="vertical" autoSaveId="right-v" className="sub-group-right">
              <Panel defaultSize={50} minSize={15} collapsible className="panel-content">
                <CourseDisplay1 />
              </Panel>
              <PanelResizeHandle className="handle-horizontal" />
              <Panel minSize={15} collapsible className="panel-content">
                <CourseDisplay2 />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </DndProvider>
  );
}

export default App;