# ExamMaster - Quick Start Guide

## Getting Started in 3 Steps

### 1. Install Dependencies
```bash
cd /Users/wangxiaopei/work/exammaster-trial
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The application will start at `http://localhost:5173` (or another port if 5173 is busy).

### 3. Try It Out!
- **Register**: Create a new account with any email and password
- **Login**: Sign in with your credentials
- **Browse Lessons**: See available lessons on the home page
- **Watch Video**: Click "Watch Video" to play and control videos
- **Practice**: Click "Practice" to answer questions and get scored

## Demo Credentials
You can use any email/password combination:
- Email: `test@example.com`
- Password: `password123`

## Features to Try

### 📺 Video Player
- Play/Pause the video
- Adjust volume
- Seek through the video using the progress bar
- Click fullscreen button to go fullscreen
- View current time and duration

### ✍️ Practice Mode
- Read the passage
- Answer all multiple-choice questions
- Swipe left/right (on mobile) or click Previous/Next to navigate paragraphs
- Click "Submit Answers" to check your results
- View your score in the results dialog

### 🎯 Progress Tracking
- Each lesson shows your progress percentage
- Progress bar updates as you complete practice sections

## Project Structure

```
src/
├── components/          # React components
├── store/              # Zustand state management
├── App.jsx             # Main routing
├── main.jsx            # Entry point
└── index.css           # Tailwind CSS
```

## Key Components

| Component | Purpose |
|-----------|---------|
| Login | User authentication |
| Register | New user registration |
| LessonList | Browse all lessons |
| LessonDetail | Watch videos |
| Practice | Answer questions |

## Customizing Content

### Add More Lessons
Edit `src/store/lessonStore.js`:
```javascript
const mockLessons = [
  {
    id: '3',
    title: 'Your New Lesson',
    description: 'Description',
    videoUrl: 'your-video-url',
    progress: 0,
    practices: [/* practice data */]
  }
]
```

### Modify Questions
In the same file, update the `practices` array with your questions.

## Troubleshooting

**Port already in use?**
Vite will automatically try the next available port.

**Styles not loading?**
```bash
npm run dev
# Then clear your browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
```

**Video won't play?**
- Check the video URL is valid
- Ensure it's not blocked by CORS
- Try a different video format

## Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## Next Steps

1. Customize lessons and practice questions
2. Add your own video URLs
3. Deploy to production (Vercel, Netlify, GitHub Pages)
4. Connect to a backend API for real authentication and data persistence

## Support

For detailed documentation, see [PROJECT_SETUP.md](./PROJECT_SETUP.md)
