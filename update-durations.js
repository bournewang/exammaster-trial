#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const coursesJsonPath = path.join(__dirname, 'public', 'courses.json');
const videosDir = path.join(__dirname, 'public', 'videos');

// Function to get video duration using ffprobe
function getVideoDuration(videoPath) {
  try {
    const command = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`;
    const result = execSync(command, { encoding: 'utf8' });
    const duration = parseFloat(result.trim());
    return Math.round(duration); // Round to nearest second
  } catch (error) {
    console.error(`Error getting duration for ${videoPath}:`, error.message);
    return null;
  }
}

// Function to update courses.json with actual video durations
function updateCourseDurations() {
  try {
    // Read courses.json
    const coursesData = JSON.parse(fs.readFileSync(coursesJsonPath, 'utf8'));
    console.log(`Found ${coursesData.length} courses to update`);
    
    let updatedCount = 0;
    
    // Process each course
    for (const course of coursesData) {
      const videoPath = path.join(videosDir, `${course.id}.mp4`);
      
      // Check if video file exists
      if (!fs.existsSync(videoPath)) {
        console.warn(`Video file not found: ${videoPath}`);
        continue;
      }
      
      // Get actual duration
      const actualDuration = getVideoDuration(videoPath);
      
      if (actualDuration !== null) {
        const oldDuration = course.duration;
        course.duration = actualDuration;
        updatedCount++;
        
        console.log(`Course ${course.id} (${course.name}): ${oldDuration}s -> ${actualDuration}s`);
      } else {
        console.warn(`Failed to get duration for course ${course.id}`);
      }
    }
    
    // Write updated data back to courses.json
    fs.writeFileSync(coursesJsonPath, JSON.stringify(coursesData, null, 2));
    
    console.log(`\nSuccessfully updated durations for ${updatedCount} courses`);
    console.log('Updated courses.json saved');
    
  } catch (error) {
    console.error('Error updating course durations:', error.message);
    process.exit(1);
  }
}

// Run the update
console.log('Starting video duration update...\n');
updateCourseDurations();