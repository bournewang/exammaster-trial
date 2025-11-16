import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import CodeVerification from './components/CodeVerification';
import LessonList from './components/LessonList';
import LessonDetail from './components/LessonDetail';
import Practice from './components/Practice';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Code verification is now the entry point */}
        <Route path="/" element={<CodeVerification />} />
        {/* Keep /verify-code as an alias for backward compatibility */}
        <Route path="/verify-code" element={<CodeVerification />} />
        <Route
          path="/lessons"
          element={
            <ProtectedRoute>
              <LessonList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson/:id"
          element={
            <ProtectedRoute>
              <LessonDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/:practiceId"
          element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
