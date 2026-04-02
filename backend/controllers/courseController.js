import Course from '../models/Course.js';
import SelfPacedEnrollment from '../models/SelfPacedEnrollment.js';
import cloudflareR2Service from '../services/cloudflareR2Service.js';
import { createCohortCourseMeeting } from '../services/zoomService.js';
import { sendCourseReminder } from '../services/emailService.js';

// Create a new course (specialist only)
export const createCourse = async (req, res) => {
  try {
    const { title, description, courseType, price, currency = 'USD',
      cohortSize, startDate, endDate, schedule, meetingPlatform, zoomLink, liveSessions,
      purchaseNote,
    } = req.body;
    
    if (!title || !courseType) {
      return res.status(400).json({
        success: false,
        message: 'Title and course type are required',
      });
    }

    // Validate currency
    if (!['USD', 'INR'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency. Supported currencies are USD and INR',
      });
    }

    const courseData = {
      specialistId: req.user?.userId || req.body.specialistId,
      specialistEmail: req.user?.email || req.body.specialistEmail,
      title,
      description,
      courseType,
      price: price || 0,
      currency,
      lessons: [],
      status: 'draft',
    };

    // Include thumbnail if provided
    if (req.body.thumbnail) courseData.thumbnail = req.body.thumbnail;

    // Add purchaseNote for all course types
    if (purchaseNote) courseData.purchaseNote = purchaseNote;

    // Add date fields for all course types
    if (startDate) courseData.startDate = startDate;
    if (endDate) courseData.endDate = endDate;

    // Add cohort-specific fields
    if (courseType === 'cohort' || courseType === 'cohort-based') {
      if (cohortSize) courseData.cohortSize = cohortSize;
      if (schedule) courseData.schedule = schedule;
      if (meetingPlatform) courseData.meetingPlatform = meetingPlatform;
      if (zoomLink) courseData.zoomLink = zoomLink;
      if (liveSessions) courseData.liveSessions = liveSessions;
    }

    const course = new Course(courseData);

    await course.save();
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      courseId: course._id,
      status: 'draft',
      currency: course.currency,
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all courses (with optional filter)
export const getAllCourses = async (req, res) => {
  try {
    const { specialistEmail, status } = req.query;
    const filter = {};

    if (specialistEmail) filter.specialistEmail = specialistEmail;
    if (status) filter.status = status;

    const courses = await Course.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get published courses for browsing (customer view)
export const browseCourses = async (req, res) => {
  try {
    const { courseType } = req.query;
    const filter = { status: 'published' };

    if (courseType) filter.courseType = courseType;

    const courses = await Course.find(filter)
      .select('_id title description thumbnail specialistEmail courseType price currency lessons startDate endDate schedule meetingPlatform zoomLink cohortSize liveSessions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Validate currency if provided
    if (req.body.currency && !['USD', 'INR'].includes(req.body.currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency. Supported currencies are USD and INR',
      });
    }

    // Update course fields
    Object.assign(course, req.body);
    course.updatedAt = new Date();
    
    // Auto-publish if course is draft and has title, description, and at least 1 lesson
    if (course.status === 'draft' && course.title && course.description && course.lessons && course.lessons.length > 0) {
      course.status = 'published';
      course.publishedAt = new Date();
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      courseStatus: course.status,
      currency: course.currency,
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Add lesson to course
export const addLesson = async (req, res) => {
  try {
    const { title, videoUrl, files, order, cloudflareStreamId, cloudflareStatus } = req.body;
    const courseId = req.params.id;

    if (!title || order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title and order are required. VideoUrl is optional.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const lesson = {
      title,
      videoUrl: videoUrl || null,
      order,
      files: files || [],
    };

    // Include Cloudflare video metadata if provided
    if (cloudflareStreamId) {
      lesson.cloudflareStreamId = cloudflareStreamId;
      lesson.cloudflareStatus = cloudflareStatus || 'pending';
    }

    course.lessons.push(lesson);
    
    // Auto-publish if course has title, description, and at least 1 lesson
    if (course.status === 'draft' && course.title && course.description && course.lessons.length > 0) {
      course.status = 'published';
      course.publishedAt = new Date();
    }
    
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lesson added successfully',
      lesson: course.lessons[course.lessons.length - 1],
      courseStatus: course.status,
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update existing lesson
export const updateLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { title, files, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    // Update lesson properties
    if (title !== undefined) lesson.title = title;
    if (order !== undefined) lesson.order = order;
    if (files !== undefined) lesson.files = files;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      lesson,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Publish course
export const publishCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Validate: must have title, description, and at least 1 lesson
    if (!course.title || !course.description) {
      return res.status(400).json({
        success: false,
        message: 'Course must have title and description',
      });
    }

    const lessonsCount = course.lessons && course.lessons.length ? course.lessons.length : 0;
    if (lessonsCount === 0 && course.courseType === 'self-paced') {
      return res.status(400).json({
        success: false,
        message: 'Self-paced course must have at least 1 lesson',
      });
    }

    course.status = 'published';
    course.publishedAt = new Date();

    // Auto-create Zoom meeting for cohort courses with Zoom as meeting platform
    let zoomMeetingCreated = false;
    if ((course.courseType === 'cohort' || course.courseType === 'cohort-based') && course.meetingPlatform === 'zoom' && !course.zoomLink) {
      try {
        const specialistId = course.specialistId?.toString() || req.user?.id;
        const meeting = await createCohortCourseMeeting(course, specialistId);
        course.zoomLink = meeting.joinUrl;
        course.zoomStartUrl = meeting.startUrl;
        zoomMeetingCreated = true;
        console.log(`✅ Auto-created Zoom meeting for course "${course.title}": ${meeting.joinUrl}`);
      } catch (zoomError) {
        console.warn(`⚠️ Could not auto-create Zoom meeting for course "${course.title}": ${zoomError.message}`);
        // Don't block publishing — specialist can add link manually
      }
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: zoomMeetingCreated 
        ? 'Course published successfully. Zoom meeting link created automatically!'
        : 'Course published successfully',
      status: 'published',
      zoomMeetingCreated,
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Generate Zoom meeting link for a cohort course
export const generateZoomMeeting = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.courseType !== 'cohort' && course.courseType !== 'cohort-based') {
      return res.status(400).json({ success: false, message: 'Zoom meeting generation is only for cohort courses' });
    }

    const specialistId = course.specialistId?.toString() || req.user?.id;
    const meeting = await createCohortCourseMeeting(course, specialistId);

    course.zoomLink = meeting.joinUrl;
    course.zoomStartUrl = meeting.startUrl;
    course.meetingPlatform = 'zoom';
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Zoom meeting created successfully',
      zoomLink: meeting.joinUrl,
      zoomStartUrl: meeting.startUrl,
      data: course,
    });
  } catch (error) {
    console.error('Error generating Zoom meeting:', error.message);
    res.status(400).json({
      success: false,
      message: error.message?.includes('No Zoom OAuth token')
        ? 'Please connect your Zoom account in Settings first.'
        : `Failed to create Zoom meeting: ${error.message}`,
    });
  }
};

// Archive course
export const archiveCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', updatedAt: new Date() },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course archived successfully',
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload file to lesson (R2 storage)
export const uploadFileToLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    // Max file size: 100MB
    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 100MB limit',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    // Upload to Cloudflare R2
    const uploadResult = await cloudflareR2Service.uploadFile(
      courseId,
      lessonId,
      file.originalname,
      file.buffer,
      file.mimetype
    );

    // Extract file type from filename
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'other';
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'xls': 'xls',
      'xlsx': 'xlsx',
      'ppt': 'ppt',
      'pptx': 'pptx',
      'txt': 'txt',
      'zip': 'zip',
    };
    const fileType = typeMap[extension] || 'other';

    // Create file object with R2 details
    const newFile = {
      fileName: file.originalname,
      fileUrl: uploadResult.downloadUrl,
      fileKey: uploadResult.fileKey,
      fileType,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    };

    // Initialize files array if not exists
    if (!lesson.files) {
      lesson.files = [];
    }

    // Check if file already exists
    const fileExists = lesson.files.some(
      f => f.fileKey === uploadResult.fileKey
    );

    if (fileExists) {
      return res.status(400).json({
        success: false,
        message: 'This file is already attached to the lesson',
      });
    }

    lesson.files.push(newFile);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: newFile,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
    });
  }
};

// Delete file from lesson
export const deleteFileFromLesson = async (req, res) => {
  try {
    const { courseId, lessonId, fileKey } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    if (!lesson.files) {
      return res.status(404).json({
        success: false,
        message: 'No files in this lesson',
      });
    }

    const fileIndex = lesson.files.findIndex(f => f.fileKey === decodeURIComponent(fileKey));
    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const fileToDelete = lesson.files[fileIndex];

    // Delete from R2
    try {
      await cloudflareR2Service.deleteFile(fileToDelete.fileKey);
    } catch (r2Error) {
      console.warn('Warning: File may not exist in R2:', r2Error.message);
      // Continue anyway and remove from database
    }

    lesson.files.splice(fileIndex, 1);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file',
    });
  }
};

// Deprecated: Remove file from lesson (for backwards compatibility)
export const removeFileFromLesson = async (req, res) => {
  try {
    const { courseId, lessonId, fileId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    if (!lesson.files) {
      return res.status(404).json({
        success: false,
        message: 'No files in this lesson',
      });
    }

    const fileIndex = lesson.files.findIndex(f => f._id.toString() === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    lesson.files.splice(fileIndex, 1);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'File removed from lesson successfully',
      lesson,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Send reminder email to all enrolled students
export const sendReminder = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollments = await SelfPacedEnrollment.find({
      courseId: course._id,
      status: 'active',
    });

    if (enrollments.length === 0) {
      return res.status(200).json({ success: true, message: 'No active enrollments to notify', sent: 0 });
    }

    let sent = 0;
    for (const enrollment of enrollments) {
      try {
        await sendCourseReminder({
          customerEmail: enrollment.customerEmail,
          customerName: enrollment.customerEmail.split('@')[0],
          courseName: course.title,
          startDate: course.startDate,
          schedule: course.schedule,
          meetingPlatform: course.meetingPlatform,
          zoomLink: course.zoomLink,
          purchaseNote: course.purchaseNote,
          customMessage: req.body.message || '',
        });
        sent++;
      } catch (emailErr) {
        console.error(`Failed to send reminder to ${enrollment.customerEmail}:`, emailErr.message);
      }
    }

    res.status(200).json({ success: true, message: `Reminder sent to ${sent} student(s)`, sent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
