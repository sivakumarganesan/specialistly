import Course from '../models/Course.js';

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
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
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
      message: 'Course updated successfully',
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
    const { title, videoUrl, order } = req.body;
    const courseId = req.params.id;

    if (!title || !videoUrl || order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, videoUrl, and order are required',
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
      videoUrl,
      order,
    };

    course.lessons.push(lesson);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lesson added successfully',
      lesson: course.lessons[course.lessons.length - 1],
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
