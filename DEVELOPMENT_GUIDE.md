# ExamMaster Development Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│                    React Router v7                       │
│  (/login, /register, /lessons, /lesson/:id, /practice)  │
├─────────────────────────────────────────────────────────┤
│                  Component Layer                         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Auth Pages   │ Lesson Pages │ Practice Pg  │        │
│  ├──────────────┼──────────────┼──────────────┤        │
│  │ - Login      │ - LessonList │ - Practice   │        │
│  │ - Register   │ - LessonDtl  │ - ProtRoute  │        │
│  └──────────────┴──────────────┴──────────────┘        │
├─────────────────────────────────────────────────────────┤
│                  State Management (Zustand)             │
│  ┌──────────────────┬─────────────────────────┐       │
│  │   authStore      │     lessonStore         │       │
│  ├──────────────────┼─────────────────────────┤       │
│  │ - user           │ - lessons               │       │
│  │ - isAuthent...   │ - currentLesson         │       │
│  │ - login()        │ - currentPractice       │       │
│  │ - register()     │ - userAnswers           │       │
│  │ - logout()       │ - practiceHistory       │       │
│  │                  │ - setUserAnswer()       │       │
│  │                  │ - submitPractice()      │       │
│  └──────────────────┴─────────────────────────┘       │
├─────────────────────────────────────────────────────────┤
│                     Styling                             │
│  Tailwind CSS + Custom CSS (index.css)                 │
├─────────────────────────────────────────────────────────┤
│                    Utilities                            │
│  Lucide Icons, React Router, Zustand                   │
└─────────────────────────────────────────────────────────┘
```

## File Structure Explained

### Components (`src/components/`)

#### Login.jsx
- **Purpose**: User login page
- **State**: email, password, error
- **Functions**: handleSubmit, validation logic
- **Uses**: useAuthStore for login, useNavigate for routing
- **Renders**: Email/password inputs, error messages, submit button

#### Register.jsx
- **Purpose**: User registration page
- **State**: name, email, password, confirmPassword, error
- **Functions**: handleSubmit, validation logic
- **Validates**: Email format, password length (6+), password match
- **Uses**: useAuthStore for register, useNavigate for routing

#### LessonList.jsx
- **Purpose**: Display all available lessons
- **State**: selectedLessonId
- **Functions**: handleSelectLesson, handleLogout
- **Uses**: useLessonStore for lessons, useAuthStore for user info
- **Layout**: Responsive grid (1-3 columns)
- **Features**: Progress bars, lesson cards, watch/practice buttons

#### LessonDetail.jsx
- **Purpose**: Video player and lesson information
- **State**: isPlaying, currentTime, duration, volume, isFullscreen
- **Features**:
  - HTML5 video element with ref
  - Play/pause toggle
  - Volume control (0-1)
  - Seek bar for progression
  - Time display (MM:SS format)
  - Fullscreen capability
- **Uses**: useLessonStore for lesson data, useNavigate for routing

#### Practice.jsx
- **Purpose**: Interactive practice with questions and answers
- **State**: currentParagraphIndex, showResultDialog, resultData, touch coordinates
- **Features**:
  - Touch swipe detection (50px threshold)
  - Question answer tracking
  - Submit validation (all questions must be answered)
  - Result scoring and display
  - Progress tracking
- **Gestures**: 
  - Swipe left (distance > 50px): next paragraph
  - Swipe right (distance < -50px): previous paragraph
- **Functions**:
  - handleSwipe(): Calculate swipe direction
  - handleSubmit(): Score answers and show results
  - handlePrevious/Next(): Navigate paragraphs

#### ProtectedRoute.jsx
- **Purpose**: Route protection wrapper
- **Logic**: Redirect to login if not authenticated
- **Uses**: useAuthStore for isAuthenticated

### State Management (`src/store/`)

#### authStore.js
```javascript
{
  user: {
    id: string,
    email: string,
    name: string
  },
  isAuthenticated: boolean,
  login(email, password): void,
  register(email, password, name): void,
  logout(): void
}
```

#### lessonStore.js
```javascript
{
  lessons: Lesson[],
  currentLesson: Lesson | null,
  currentPractice: Practice | null,
  userAnswers: Record<questionId, answerIndex>,
  practiceHistory: Record<paragraphId, { rate: number, timestamp: string }>,
  
  setCurrentLesson(lessonId): void,
  setCurrentPractice(practiceId): void,
  setUserAnswer(questionId, answerIndex): void,
  submitPractice(paragraphId): void,
  resetAnswers(): void
}
```

## Data Models

### Lesson
```javascript
{
  id: string,
  title: string,
  description: string,
  videoUrl: string,
  progress: number (0-100),
  practices: Practice[]
}
```

### Practice
```javascript
{
  id: string,
  title: string,
  paragraphs: Paragraph[]
}
```

### Paragraph
```javascript
{
  id: string,
  title: string,
  passage: string,
  questions: Question[]
}
```

### Question
```javascript
{
  id: string,
  text: string,
  options: string[],
  correctAnswer: number (index)
}
```

## Development Workflow

### Adding a New Lesson

1. **Update Mock Data** (`src/store/lessonStore.js`):
```javascript
const mockLessons = [
  // ... existing lessons
  {
    id: '3',
    title: 'New Lesson Title',
    description: 'Description',
    videoUrl: 'https://example.com/video.mp4',
    progress: 0,
    practices: [
      {
        id: 'p3',
        title: 'Practice Title',
        paragraphs: [
          {
            id: 'para1',
            title: 'Paragraph Title',
            passage: 'The passage content...',
            questions: [
              {
                id: 'q1',
                text: 'Question text?',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0
              }
            ]
          }
        ]
      }
    ]
  }
]
```

2. **Test the Lesson**:
   - Start dev server (`npm run dev`)
   - Navigate to lessons page
   - Click on new lesson
   - Test video playback and practice mode

### Customizing Styling

1. **Global Styles**: Edit `src/index.css`
2. **Tailwind Config**: Modify `tailwind.config.js` for theme
3. **Component Styles**: Use Tailwind classes directly in JSX

Example of adding custom colors:
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: '#FF6B6B',
      }
    }
  }
}
```

### Backend Integration

#### Replace Mock Authentication

1. **Update authStore.js**:
```javascript
export const useAuthStore = create((set) => ({
  // ... other state
  
  login: async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } else {
      throw new Error(data.message);
    }
  },
  
  register: async (email, password, name) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } else {
      throw new Error(data.message);
    }
  }
}));
```

2. **Add API Utility** (`src/utils/api.js`):
```javascript
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });
  
  return response.json();
};
```

#### Fetch Lessons from Backend

```javascript
// In lessonStore.js
export const useLessonStore = create((set) => ({
  // ... other state
  
  fetchLessons: async () => {
    const lessons = await apiCall('/lessons');
    set({ lessons });
  }
}));
```

## Common Patterns

### Handling Form Submission
```javascript
const [formData, setFormData] = useState({ email: '', password: '' });
const [error, setError] = useState('');

const handleSubmit = (e) => {
  e.preventDefault();
  setError('');
  
  // Validation
  if (!formData.email || !formData.password) {
    setError('All fields required');
    return;
  }
  
  // Action
  try {
    // ... API call or store action
  } catch (err) {
    setError(err.message);
  }
};
```

### Conditional Rendering
```javascript
{isLoading ? (
  <div>Loading...</div>
) : error ? (
  <div className="error">{error}</div>
) : (
  <div>{content}</div>
)}
```

### Touch Event Handling
```javascript
const [touchStart, setTouchStart] = useState(null);

const handleTouchStart = (e) => {
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchEnd = (e) => {
  const touchEnd = e.changedTouches[0].clientX;
  const distance = touchStart - touchEnd;
  
  if (distance > 50) {
    // Swiped left
  } else if (distance < -50) {
    // Swiped right
  }
};
```

## Performance Optimization

### Code Splitting
```javascript
// In App.jsx
const Login = lazy(() => import('./components/Login'));
const LessonList = lazy(() => import('./components/LessonList'));

// Use Suspense
<Suspense fallback={<LoadingScreen />}>
  <Login />
</Suspense>
```

### Memoization
```javascript
import { memo } from 'react';

const LessonCard = memo(({ lesson, onSelect }) => {
  return <div>{lesson.title}</div>;
});
```

### Selective Store Subscriptions
```javascript
// Only subscribe to specific state
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
```

## Testing Approach

### Component Testing
```javascript
// Example test for Login component
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

test('shows error when fields are empty', async () => {
  render(<Login />);
  const button = screen.getByText('Sign In');
  fireEvent.click(button);
  
  expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
});
```

## Debugging Tips

### React DevTools
- Install React DevTools browser extension
- Inspect component tree
- View props and state

### Redux DevTools for Zustand
```javascript
// In development
import { devtools } from 'zustand/middleware';

export const useAuthStore = create(
  devtools((set) => ({ ... }))
);
```

### Console Logging
```javascript
// In components
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);
```

## Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
# Add to package.json
"homepage": "https://yourusername.github.io/exammaster",
"deploy": "npm run build && gh-pages -d dist"

npm run deploy
```

## Troubleshooting Development Issues

### Hot Module Replacement (HMR) not working
- Check Vite config
- Restart dev server
- Clear browser cache

### State not updating
- Ensure using Zustand hooks correctly
- Check that state is immutable
- Use browser devtools to inspect store

### Video not playing
- Check CORS headers
- Verify video format support
- Use browser console to see errors

### Navigation issues
- Verify route paths match exactly
- Check useNavigate() usage
- Ensure ProtectedRoute is wrapping correctly

## Resources

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vite Documentation](https://vitejs.dev)
