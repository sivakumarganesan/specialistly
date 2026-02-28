import Course from '../models/Course.js';
import cloudflareR2Service from '../services/cloudflareR2Service.js';

// Create a new course (specialist only)
export const createCourse = async (req, res) => {
  try {
    const { title, description, courseType, price } = req.body;
    
    if (!title || !courseType) {
      return res.status(400).json({
        success: false,
        message: 'Title and course type are required',
      });
    }

    const course = new Course({
      specialistId: req.user?.userId || req.body.specialistId,
      specialistEmail: req.user?.email || req.body.specialistEmail,
      title,
      description,
      courseType,
      price: price || 0,
      lessons: [],
      status: 'draft',
    });

    await course.save();
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      courseId: course._id,
      status: 'draft',
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
      .select('_id title description thumbnail specialistEmail courseType price lessons')
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
    if (lessonsCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course must have at least 1 lesson',
      });
    }

    course.status = 'published';
    course.publishedAt = new Date();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course published successfully',
      status: 'published',
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
