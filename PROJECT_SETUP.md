# ExamMaster - Online Learning Platform

A comprehensive online learning website built with React and Tailwind CSS featuring video lessons, interactive practice modes, and user authentication.

## Features

### 1. **User Authentication**
- User registration with email, password, and name
- User login with credentials
- Protected routes for authenticated users
- Logout functionality

### 2. **Lesson Management**
- Browse available lessons in a grid layout
- View lesson details with video player
- Track progress with visual progress indicators
- Quick access to practice mode

### 3. **Video Player**
- Full-featured HTML5 video player
- Play/Pause controls
- Volume control
- Progress/seek bar with time display
- Fullscreen mode support
- Video duration display

### 4. **Practice Mode**
- Multiple choice questions organized by paragraphs/passages
- One paragraph per page layout
- Interactive answer selection with instant feedback
- Submit button to check answers
- Swipe left/right to navigate between paragraphs
- Previous/Next buttons for navigation
- Progress indicator showing completion status
- Summary dialog showing:
  - Correct answer count
  - Total questions
  - Percentage score
  - Visual feedback (Great Job / Keep Trying)

## Project Structure

```
exammaster-trial/
├── src/
│   ├── components/
│   │   ├── Login.jsx              # Login page component
│   │   ├── Register.jsx           # Registration page component
│   │   ├── LessonList.jsx         # Lesson grid listing
│   │   ├── LessonDetail.jsx       # Video player page
│   │   ├── Practice.jsx           # Practice mode with Q&A
│   │   └── ProtectedRoute.jsx     # Route protection wrapper
│   ├── store/
│   │   ├── authStore.js           # Zustand auth state management
│   │   └── lessonStore.js         # Zustand lesson state management
│   ├── App.jsx                    # Main app routing
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Tailwind CSS setup
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS configuration
├── vite.config.js                 # Vite build configuration
├── package.json                   # Project dependencies
└── index.html                     # HTML entry point
```

## Installation & Setup

### Prerequisites
- Node.js v20.19+ or v22.12+
- npm or yarn

### Steps

1. **Install Dependencies**
   ```bash
   cd /Users/wangxiaopei/work/exammaster-trial
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## Technology Stack

### Frontend
- **React 18** - UI library
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Lucide React** - Icon library
- **Vite** - Fast build tool and dev server

### Styling
- Tailwind CSS for responsive design
- Gradient backgrounds and animations
- Mobile-first design approach

## Component Details

### Login Component
- Email and password input fields
- Form validation
- Error message display
- Link to registration page
- Gradient background design

### Register Component
- Full name, email, password, and confirm password fields
- Password validation (min 6 characters)
- Password match confirmation
- Form validation with error messages
- Link to login page

### LessonList Component
- Displays all available lessons in a grid
- Shows lesson title, description, and thumbnail
- Progress bar for each lesson
- "Watch Video" button to view lesson
- "Practice" button to start practice mode
- User welcome message and logout option
- Responsive grid layout (1-3 columns based on screen size)

### LessonDetail Component
- Full-screen video player
- Play/Pause button
- Volume control slider
- Progress bar with seek functionality
- Current time and total duration display
- Fullscreen button
- Lesson progress indicator
- Duration display
- Practice button
- Lesson description section

### Practice Component
- Displays passage/paragraph content
- Multiple choice questions with options
- Radio button selection for answers
- Visual feedback for correct/incorrect answers
- Submit button (disabled until all questions answered)
- Previous/Next navigation buttons
- Swipe gesture support (left/right)
- Progress bar showing completion
- Summary dialog with results
- Correct/incorrect count display
- Percentage score calculation

## State Management with Zustand

### authStore
- `user` - Current logged-in user object
- `isAuthenticated` - Boolean auth status
- `login()` - Mock login function
- `register()` - Mock registration function
- `logout()` - Logout function

### lessonStore
- `lessons` - Array of available lessons
- `currentLesson` - Currently selected lesson
- `currentPractice` - Currently active practice
- `userAnswers` - Map of question IDs to selected answers
- `practiceHistory` - History of completed practices
- `setCurrentLesson()` - Set active lesson
- `setCurrentPractice()` - Set active practice
- `setUserAnswer()` - Save user answer
- `submitPractice()` - Submit and score practice
- `resetAnswers()` - Clear all answers

## Mock Data

The application comes with mock data for demonstration:
- 2 sample lessons: "Introduction to React" and "Advanced React Patterns"
- Each lesson has video URLs pointing to sample videos
- Practice mode includes multiple paragraphs with questions and answers
- All authentication is client-side mock (no backend required for demo)

## Features in Detail

### Video Player Features
- HTML5 native video element
- Custom controls with Tailwind styling
- Volume control (0-100%)
- Seek bar with click-to-seek functionality
- Time display format (MM:SS)
- Fullscreen support
- Auto-pause on video end

### Practice Mode Features
- Touch swipe support for mobile navigation
- Keyboard-accessible form inputs
- Real-time answer feedback
- Progress tracking
- Score calculation with percentage
- Beautiful result dialog with animations
- Responsive design for all screen sizes

### Authentication Features
- Email validation (basic @ check)
- Password strength requirement (6+ characters)
- Password confirmation matching
- Protected routes (redirect to login if not authenticated)
- Session persistence using Zustand store

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Modifying Lessons
Edit `src/store/lessonStore.js` to add, remove, or modify lessons and practice questions.

### Styling
- Colors and spacing can be adjusted in `tailwind.config.js`
- Component-specific styles use Tailwind utility classes
- Dark/light mode can be added via Tailwind dark mode config

### Authentication
To connect to a real backend:
1. Replace mock `login()` and `register()` functions in `authStore.js`
2. Add API calls to your backend
3. Implement token-based authentication (JWT)
4. Add localStorage/sessionStorage for persistence

### Video URLs
Replace the `videoUrl` in mock data with your own video URLs or CDN links.

## Future Enhancements

1. Backend API integration (Node.js/Express, Django, etc.)
2. Database integration (MongoDB, PostgreSQL)
3. User progress tracking and statistics
4. Certificate generation
5. Instructor dashboard
6. Video upload functionality
7. Discussion forums
8. Quiz analytics
9. Payment integration for premium courses
10. Dark mode toggle
11. Multi-language support
12. Video subtitle support
13. Downloadable resources
14. Real-time notifications

## Known Limitations

- Authentication is client-side only (mock)
- No persistent data storage (in-memory only)
- Video URLs are hardcoded (must update manually)
- No email verification
- No password recovery
- No user profile editing
- No course ratings/reviews

## Troubleshooting

### Development Server Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Tailwind Styles Not Applied
- Ensure `index.css` contains Tailwind directives
- Check `tailwind.config.js` has correct content paths
- Restart development server after config changes

### Video Player Not Working
- Verify video URL is accessible
- Check browser console for CORS errors
- Ensure video format is supported (MP4, WebM, etc.)

## License

MIT License

## Support

For issues or questions, please refer to the component documentation above.
