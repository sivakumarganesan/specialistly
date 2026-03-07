import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { courseAPI, videoAPI, API_BASE_URL } from "@/app/api/apiClient";
import { useAuth } from "@/app/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Users,
  Clock,
  DollarSign,
  BookOpen,
  Video,
  FileText,
  Calendar,
  X,
  CheckCircle,
  PlayCircle,
  Play,
  Award,
} from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";

interface Module {
  id: string;
  title: string;
  duration: string;
  lessonsCount: number;
}

interface Course {
  id: string;
  title: string;
  type: "self-paced" | "cohort-based";
  description: string;
  price: string;
  currency?: string; // Add currency field
  duration: string;
  studentsEnrolled: number;
  status: "published" | "draft";
  level: string;
  category: string;
  thumbnail?: string;
  // Self-paced specific fields
  modules?: Module[];
  totalLessons?: number;
  certificateIncluded?: boolean;
  accessDuration?: string;
  lessons?: any[];
  // Cohort-based specific fields
  cohortSize?: string;
  startDate?: string;
  endDate?: string;
  schedule?: string;
  meetingPlatform?: string;
  liveSessions?: number;
}

interface SearchableItem {
  id: string;
  title: string;
  type: "course" | "offering";
}

interface CoursesProps {
  onUpdateSearchableItems: (items: SearchableItem[]) => void;
}

export function Courses({ onUpdateSearchableItems }: CoursesProps) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load courses from API
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        const response = await courseAPI.getAll({ specialistEmail: user?.email });
        const courseData = response.data || response;
        if (courseData) {
          // Transform MongoDB data to Course interface
          const transformedCourses: Course[] = (Array.isArray(courseData) ? courseData : []).map((course: any) => ({
            id: course._id || course.id,
            title: course.title,
            type: course.courseType || course.type,
            description: course.description,
            price: course.price?.toString() || "",
            duration: course.duration || "",
            studentsEnrolled: course.studentsEnrolled || 0,
            status: course.status || "draft",
            level: course.level || "Beginner",
            category: course.category || "Technology",
            modules: course.modules,
            totalLessons: course.totalLessons,
            certificateIncluded: course.certificateIncluded !== undefined ? course.certificateIncluded : true,
            accessDuration: course.accessDuration || "Lifetime",
            lessons: course.lessons || [],
            cohortSize: course.cohortSize || "",
            startDate: course.startDate || "",
            endDate: course.endDate || "",
            schedule: course.schedule || "",
            meetingPlatform: course.meetingPlatform || "Zoom",
            liveSessions: course.liveSessions,
          }));
          setCourses(transformedCourses);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
        // Keep empty array if no courses exist yet
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Update searchable items whenever courses change
  useEffect(() => {
    const searchableItems: SearchableItem[] = courses.map(course => ({
      id: course.id,
      title: course.title,
      type: "course",
    }));
    onUpdateSearchableItems(searchableItems);
  }, [courses]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageLessonsDialogOpen, setManageLessonsDialogOpen] = useState(false);
  const [enrollmentsDialogOpen, setEnrollmentsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseType, setCourseType] = useState<"self-paced" | "cohort-based" | null>(null);
  const [courseEnrollments, setCourseEnrollments] = useState<any[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  interface Lesson {
    _id?: string;
    title: string;
    order: number;
    files?: LessonFile[];
    hlsUrl?: string;
    cloudflareStreamId?: string;
    cloudflareStatus?: string;
    videoThumbnail?: string;
  }

  interface LessonFile {
    _id?: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    uploadedAt?: string;
    googleDriveFileId?: string;
    downloadLink?: string;
    viewLink?: string;
  }

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [uploadingFileFor, setUploadingFileFor] = useState<number | null>(null);
  const [selectedFilesByLesson, setSelectedFilesByLesson] = useState<{ [key: number]: File[] }>({});
  const [uploadingVideoFor, setUploadingVideoFor] = useState<number | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<{ [key: number]: number }>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    price: "",
    currency: "USD",
    duration: "",
    // Cohort-based specific fields
    cohortSize: "",
    startDate: "",
    endDate: "",
    schedule: "",
    meetingPlatform: "Zoom",
    liveSessions: "",
  });

  const [modules, setModules] = useState<Module[]>([
    { id: "1", title: "Introduction to Course", duration: "2 hours", lessonsCount: 5 },
  ]);

  const handleCreateCourse = async () => {
    if (courseType && formData.title) {
      const courseData = {
        title: formData.title,
        courseType: courseType,
        description: formData.description,
        thumbnail: formData.thumbnail || "",
        price: parseInt(formData.price) || 0,
        currency: formData.currency || "USD",
        duration: formData.duration,
        status: "draft",
        specialistId: user?.id,
        specialistEmail: user?.email,
        ...(courseType === "cohort-based" && {
          cohortSize: formData.cohortSize,
          startDate: formData.startDate,
          endDate: formData.endDate,
          schedule: formData.schedule,
          meetingPlatform: formData.meetingPlatform,
          liveSessions: parseInt(formData.liveSessions) || 0,
        }),
      };
      
      try {
        const response = await courseAPI.create(courseData);
        const newCourse: Course = {
          id: response.data?._id,
          ...courseData,
          type: courseType,
        };
        setCourses([...courses, newCourse]);
        setCreateDialogOpen(false);
        setCourseType(null);
        resetForm();
        alert("✓ Course created successfully!");
      } catch (error) {
        console.error("Failed to create course:", error);
        alert(`Failed to create course: ${error instanceof Error ? error.message : "Please try again."}`);
      }
    }
  };

  const handleEditCourse = async () => {
    if (selectedCourse && formData.title) {
      // Remove _id from modules to let backend generate them for new modules
      const modulesData = modules.map(({ id, ...rest }) => rest);
      const updatedData = {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail || "",
        price: parseInt(formData.price) || 0,
        currency: formData.currency || "USD",
        duration: formData.duration,
        specialistId: user?.id,
        specialistEmail: user?.email,
        ...(selectedCourse.type === "cohort-based" && {
          cohortSize: formData.cohortSize,
          startDate: formData.startDate,
          endDate: formData.endDate,
          schedule: formData.schedule,
          meetingPlatform: formData.meetingPlatform,
          liveSessions: parseInt(formData.liveSessions) || 0,
        }),
      };
      
      try {
        await courseAPI.update(selectedCourse.id, updatedData);
        setCourses(
          courses.map((course) =>
            course.id === selectedCourse.id
              ? {
                  ...course,
                  ...updatedData,
                }
              : course
          )
        );
        setEditDialogOpen(false);
        setSelectedCourse(null);
        resetForm();
        alert("✓ Course updated successfully!");
      } catch (error) {
        console.error("Failed to update course:", error);
        alert(`Failed to update course: ${error instanceof Error ? error.message : "Please try again."}`);
      }
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        await courseAPI.delete(id);
        setCourses(courses.filter((course) => course.id !== id));
        alert("✓ Course deleted successfully!");
      } catch (error) {
        console.error("Failed to delete course:", error);
        alert(`Failed to delete course: ${error instanceof Error ? error.message : "Please try again."}`);
      }
    }
  };

  const toggleStatus = async (id: string) => {
    const course = courses.find(c => c.id === id);
    if (course) {
      const newStatus = course.status === "published" ? "draft" : "published";
      try {
        await courseAPI.update(id, { status: newStatus });
        setCourses(
          courses.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: newStatus,
                }
              : c
          )
        );
        alert(`✓ Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
      } catch (error) {
        console.error("Failed to update course status:", error);
        alert(`Failed to update course status: ${error instanceof Error ? error.message : "Please try again."}`);
      }
    }
  };

  const openEnrollmentsDialog = async (course: Course) => {
    setSelectedCourse(course);
    setEnrollmentsDialogOpen(true);
    setEnrollmentsLoading(true);
    try {
      const response = await courseAPI.getCourseEnrollments(course.id);
      setCourseEnrollments(response.data?.enrollments || []);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
      alert(`Failed to fetch enrollments: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      price: course.price || "",
      currency: course.currency || "USD",
      duration: course.duration || "",
      cohortSize: course.cohortSize || "",
      startDate: course.startDate || "",
      endDate: course.endDate || "",
      schedule: course.schedule || "",
      meetingPlatform: course.meetingPlatform || "Zoom",
      liveSessions: course.liveSessions?.toString() || "",
    });
    if (course.modules && course.modules.length > 0) {
      setModules(course.modules);
    } else {
      setModules([{ id: "1", title: "Introduction to Course", duration: "2 hours", lessonsCount: 5 }]);
    }
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      thumbnail: "",
      price: "",
      currency: "USD",
      duration: "",
      cohortSize: "",
      startDate: "",
      endDate: "",
      schedule: "",
      meetingPlatform: "Zoom",
      liveSessions: "",
    });
    setModules([{ id: "1", title: "Introduction to Course", duration: "2 hours", lessonsCount: 5 }]);
  };

  const openCreateDialog = (type: "self-paced" | "cohort-based") => {
    setCourseType(type);
    resetForm();
    setCreateDialogOpen(true);
  };

  const addModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: "",
      duration: "",
      lessonsCount: 0,
    };
    setModules([...modules, newModule]);
  };

  const removeModule = (id: string) => {
    if (modules.length > 1) {
      setModules(modules.filter((m) => m.id !== id));
    }
  };

  const updateModule = (id: string, field: keyof Module, value: string | number) => {
    setModules(
      modules.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      title: "",
      order: lessons.length + 1,
    };
    setLessons([...lessons, newLesson]);
  };

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string | number) => {
    setLessons(
      lessons.map((lesson, i) =>
        i === index ? { ...lesson, [field]: value } : lesson
      )
    );
  };

  const uploadVideoToCloudflare = async (lessonIndex: number, file: File) => {
    try {
      if (!selectedCourse) {
        throw new Error("No course selected");
      }

      const lesson = lessons[lessonIndex];
      if (!lesson || !lesson.title) {
        throw new Error("Lesson title is required before uploading video");
      }

      setUploadingVideoFor(lessonIndex);
      setVideoUploadProgress({ ...videoUploadProgress, [lessonIndex]: 0 });

      // Ensure lesson has an ID (use MongoDB _id if exists, otherwise use index as temporary ID)
      const lessonId = lesson._id || `temp-${lessonIndex}-${Date.now()}`;

      // Step 1: Get upload token from backend with required metadata
      const tokenResponse = await videoAPI.getUploadToken({
        courseId: selectedCourse.id,
        lessonId: lessonId,
        title: lesson.title,
        fileName: file.name,
        fileSize: file.size,
      });

      if (!tokenResponse.success) {
        // Check for configuration errors
        if (tokenResponse.error === 'CLOUDFLARE_NOT_CONFIGURED') {
          throw new Error(
            "⚠️ Cloudflare Stream is not configured on this server.\n\n" +
            "The administrator needs to add these environment variables to the backend:\n" +
            "• CLOUDFLARE_ACCOUNT_ID\n" +
            "• CLOUDFLARE_API_TOKEN\n\n" +
            "Once configured, video uploads will work."
          );
        }
        throw new Error(tokenResponse.message || "Failed to get upload token from Cloudflare");
      }

      if (!tokenResponse.uploadUrl || !tokenResponse.streamId) {
        throw new Error("Invalid upload token response from server");
      }

      const { uploadUrl, streamId } = tokenResponse;

      // Step 2: Upload video to Cloudflare
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      setVideoUploadProgress({ ...videoUploadProgress, [lessonIndex]: 100 });

      // Step 3: Update lesson with video metadata
      const updatedLessons = [...lessons];
      updatedLessons[lessonIndex] = {
        ...updatedLessons[lessonIndex],
        cloudflareStreamId: streamId,
        cloudflareStatus: "inprogress", // Valid enum: 'ready', 'inprogress', 'error', 'pending'
      };
      setLessons(updatedLessons);

      alert("✓ Video uploaded! Cloudflare is processing it. Check back in a few minutes.");
    } catch (error) {
      console.error("Video upload error:", error);
      alert(
        `Video upload failed: ${error instanceof Error ? error.message : "Please try again."}`
      );
    } finally {
      setUploadingVideoFor(null);
      setVideoUploadProgress({});
    }
  };

  const handleFileSelect = (lessonIndex: number, files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const lesson = lessons[lessonIndex];
    
    if (!lesson.files) {
      lesson.files = [];
    }
    
    // Add selected files to the lesson
    for (const file of fileArray) {
      // Validate filename doesn't contain spaces
      if (file.name.includes(' ')) {
        alert(
          "⚠️ Filename cannot contain spaces.\n\n" +
          "Please rename your file and try again.\n\n" +
          "Example: 'MyFile.pdf' instead of 'My File.pdf'"
        );
        continue;
      }

      const fileType = getFileType(file.name);
      const newFile: LessonFile = {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // Temporary URL for preview
        fileType: fileType,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };
      
      if (!lesson.files.find(f => f.fileName === file.name)) {
        lesson.files.push(newFile);
      }
    }
    
    setLessons([...lessons]);
  };

  const extractFileId = (url: string): string => {
    if (!url) return '';
    if (url.includes('/d/')) {
      return url.split('/d/')[1]?.split('/')[0] || '';
    } else if (url.includes('id=')) {
      return new URL(url).searchParams.get('id') || '';
    }
    return url;
  };

  const uploadFileToLesson = async (lessonIndex: number, file: File) => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }

    const lesson = lessons[lessonIndex];

    try {
      // Max file size: 100MB
      const maxFileSize = 100 * 1024 * 1024;
      if (file.size > maxFileSize) {
        alert("File size exceeds 100MB limit");
        return;
      }

      setUploadingFileFor(lessonIndex);

      // If lesson doesn't have an ID yet, we can't upload through the API
      if (!lesson._id) {
        // For new lessons, we'll add files locally with a placeholder and get real URL after lesson is created
        if (!lesson.files) {
          lesson.files = [];
        }

        const newFile: LessonFile = {
          fileName: file.name,
          fileUrl: '', // Will be populated after lesson creation
          fileType: getFileType(file.name),
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };

        lesson.files.push(newFile);
        setLessons([...lessons]);
        alert(`✓ File "${file.name}" added. It will be uploaded when you save the course.`);
        return;
      }

      // For existing lessons, upload to R2
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/courses/${selectedCourse.id}/lessons/${lesson._id}/files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const data = await response.json();

      if (!lesson.files) {
        lesson.files = [];
      }

      lesson.files.push(data.file);
      setLessons([...lessons]);
      alert(`✓ File "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Please try again'}`);
    } finally {
      setUploadingFileFor(null);
    }
  };

  const deleteFileFromLesson = async (lessonIndex: number, fileIndex: number) => {
    const lesson = lessons[lessonIndex];
    if (!lesson.files) return;

    const file = lesson.files[fileIndex];
    
    // If file hasn't been uploaded yet, just remove from local state
    if (!file.fileKey) {
      lesson.files.splice(fileIndex, 1);
      setLessons([...lessons]);
      return;
    }

    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/courses/${selectedCourse.id}/lessons/${lesson._id}/files/${encodeURIComponent(file.fileKey)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete file');
      }

      lesson.files.splice(fileIndex, 1);
      setLessons([...lessons]);
      alert('✓ File deleted successfully!');
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(`Failed to delete file: ${error instanceof Error ? error.message : 'Please try again'}`);
    }
  };

  const removeFileFromLesson = (lessonIndex: number, fileIndex: number) => {
    const lesson = lessons[lessonIndex];
    if (lesson.files) {
      lesson.files.splice(fileIndex, 1);
      setLessons([...lessons]);
    }
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || 'other';
    const typeMap: { [key: string]: string } = {
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
    return typeMap[extension] || 'other';
  };

  const getFileIcon = (fileType: string) => {
    const icons: { [key: string]: string } = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '🎯',
      'pptx': '🎯',
      'txt': '📄',
      'zip': '📦',
      'other': '📎',
    };
    return icons[fileType] || '📎';
  };

  const openManageLessonsDialog = (course: Course) => {
    setSelectedCourse(course);
    // Initialize lessons from course if they exist
    if (course.lessons && Array.isArray(course.lessons)) {
      setLessons(course.lessons.map((l: any, idx) => ({
        _id: l._id,
        title: l.title,
        order: idx + 1,
        files: l.files || [],
        cloudflareStreamId: l.cloudflareStreamId,
        cloudflareStatus: l.cloudflareStatus,
        hlsUrl: l.hlsUrl,
        videoThumbnail: l.videoThumbnail,
      })));
    } else {
      setLessons([]);
    }
    setManageLessonsDialogOpen(true);
  };

  const handleSaveLessons = async () => {
    if (!selectedCourse) return;

    // Validate all lessons have title
    const invalidLessons = lessons.filter(l => !l.title);
    if (invalidLessons.length > 0) {
      alert("Please fill in all lesson titles. You can add files optionally. Videos are managed via Cloudflare Stream.");
      return;
    }

    try {
      // Handle both new and existing lessons
      for (const lesson of lessons) {
        if (!lesson._id) {
          // Add NEW lessons
          const lessonData: any = {
            title: lesson.title,
            files: lesson.files || [],
            order: lesson.order,
          };

          // Include Cloudflare video metadata if available
          if (lesson.cloudflareStreamId) {
            lessonData.cloudflareStreamId = lesson.cloudflareStreamId;
            lessonData.cloudflareStatus = lesson.cloudflareStatus || "inprogress"; // Valid enum: 'ready', 'inprogress', 'error', 'pending'
          }

          await courseAPI.addLesson(selectedCourse.id, lessonData);
        } else if (lesson.cloudflareStreamId && typeof lesson._id === 'string' && lesson._id.length === 24) {
          // UPDATE EXISTING lessons with video metadata ONLY if _id is valid MongoDB ObjectId
          try {
            await videoAPI.saveLessonVideo({
              courseId: selectedCourse.id,
              lessonId: lesson._id,
              videoId: lesson.cloudflareStreamId,
              title: lesson.title,
              duration: lesson.duration,
              thumbnail: lesson.videoThumbnail,
            });
          } catch (videoError) {
            console.error(`Video save error for lesson ${lesson.title}:`, videoError);
            // Don't fail the whole save if video metadata save fails
          }
        }
      }
      
      setManageLessonsDialogOpen(false);
      setSelectedFilesByLesson({});
      alert("✓ Lessons saved successfully!");
      
      // Refresh courses
      const response = await courseAPI.getAll({ specialistEmail: user?.email });
      const courseData = response.data || response;
      if (courseData) {
        const transformedCourses: Course[] = (Array.isArray(courseData) ? courseData : []).map((course: any) => ({
          id: course._id || course.id,
          title: course.title,
          type: course.courseType || course.type,
          description: course.description,
          price: course.price?.toString() || "",
          duration: course.duration || "",
          studentsEnrolled: course.studentsEnrolled || 0,
          status: course.status || "draft",
          level: course.level || "Beginner",
          category: course.category || "Technology",
          modules: course.modules,
          totalLessons: course.totalLessons,
          certificateIncluded: course.certificateIncluded !== undefined ? course.certificateIncluded : true,
          accessDuration: course.accessDuration || "Lifetime",
          cohortSize: course.cohortSize || "",
          startDate: course.startDate || "",
          endDate: course.endDate || "",
          schedule: course.schedule || "",
          meetingPlatform: course.meetingPlatform || "Zoom",
          liveSessions: course.liveSessions,
          lessons: course.lessons,
        }));
        setCourses(transformedCourses);
      }
    } catch (error) {
      console.error("Failed to save lessons:", error);
      alert(`Failed to save lessons: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  };



  const getTypeIcon = (type: string) => {
    switch (type) {
      case "self-paced":
        return <PlayCircle className="h-5 w-5" />;
      case "cohort-based":
        return <Users className="h-5 w-5" />;
      default:
        return <GraduationCap className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "self-paced":
        return "bg-cyan-100 text-blue-700";
      case "cohort-based":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTotalStudents = () => {
    return courses.reduce((sum, course) => sum + course.studentsEnrolled, 0);
  };

  const getActiveCourses = () => {
    return courses.filter((c) => c.status === "published").length;
  };

  const getTotalRevenue = () => {
    return courses.reduce((sum, course) => {
      const price = parseFloat(course.price.replace(/[$,]/g, ""));
      return sum + (price * course.studentsEnrolled);
    }, 0);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Courses</h1>
          <p className="text-gray-600">
            Create and manage your course offerings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{getActiveCourses()}</p>
            </div>
          </div>
        </Card>

      </div>

      {/* Create Course Type Selection */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Create New Course</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-cyan-500"
            onClick={() => openCreateDialog("self-paced")}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-cyan-100 rounded-full">
                <PlayCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Self-Paced Course</h3>
              <p className="text-sm text-gray-600">
                Create pre-recorded courses that students can take at their own pace
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs">
                <Badge variant="outline" className="gap-1">
                  <Video className="h-3 w-3" />
                  Video Lessons
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Resources
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Award className="h-3 w-3" />
                  Certificates
                </Badge>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2">
                <Plus className="h-4 w-4" />
                Create Self-Paced
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-indigo-500"
            onClick={() => openCreateDialog("cohort-based")}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-indigo-100 rounded-full">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg">Cohort-Based Course</h3>
              <p className="text-sm text-gray-600">
                Create live courses with scheduled sessions and cohort learning
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs">
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  Scheduled
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  Live Sessions
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Video className="h-3 w-3" />
                  Interactive
                </Badge>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus className="h-4 w-4" />
                Create Cohort-Based
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Courses List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="p-4 hover:shadow-lg transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(course.type)}`}>
                      {getTypeIcon(course.type)}
                    </div>
                    <Badge className={getTypeColor(course.type)}>
                      {course.type === "self-paced" ? "Self-Paced" : "Cohort-Based"}
                    </Badge>
                  </div>
                  <Badge
                    className={
                      course.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {course.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {course.level}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {course.category}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">
                      {course.currency === 'INR' ? '₹' : '$'}
                      {course.price} {course.currency || 'USD'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-700 font-medium">Enrollments:</span>
                    </div>
                    <span className="font-bold text-blue-600">{course.studentsEnrolled}</span>
                  </div>
                  {course.type === "self-paced" && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lessons:</span>
                      <span className="font-semibold">{course.totalLessons ?? course.lessons?.length ?? 0}</span>
                    </div>
                  )}
                  {course.type === "cohort-based" && course.liveSessions && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Live Sessions:</span>
                      <span className="font-semibold">{course.liveSessions}</span>
                    </div>
                  )}
                </div>

                {course.type === "self-paced" && course.certificateIncluded && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Award className="h-4 w-4" />
                    <span>Certificate included</span>
                  </div>
                )}

                {course.type === "cohort-based" && course.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">
                      Starts: {new Date(course.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {course.type === "self-paced" && course.status === "draft" && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-sm text-blue-700 font-medium">
                      📚 Start adding lessons to build your course
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(course)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {course.type === "self-paced" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openManageLessonsDialog(course)}
                      title="Add lessons/videos to your course"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Lessons
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEnrollmentsDialog(course)}
                    title="View students enrolled in this course"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Enrollments
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(course.id)}
                  >
                    {course.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Course Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create {courseType && (courseType === "self-paced" ? "Self-Paced" : "Cohort-Based")} Course
            </DialogTitle>
            <DialogDescription>
              Fill in the details for your new course
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Common Fields */}
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Complete Web Development Masterclass"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">Course Thumbnail Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setFormData({ ...formData, thumbnail: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="thumbnail" className="cursor-pointer block">
                  {formData.thumbnail ? (
                    <div>
                      <img src={formData.thumbnail} alt="Thumbnail preview" className="w-20 h-20 object-cover mx-auto rounded mb-2" />
                      <p className="text-sm text-blue-600">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Click to upload course thumbnail</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description">Description</Label>
                <span className="text-sm text-gray-600">
                  {formData.description.length}/2000
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Describe what students will learn"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 2000) {
                    setFormData({ ...formData, description: e.target.value });
                  }
                }}
                maxLength={2000}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Maximum 2000 characters allowed for course description
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">💵 USD (United States Dollar) - Stripe</SelectItem>
                    <SelectItem value="INR">🇮🇳 INR (Indian Rupees) - Razorpay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  placeholder="99"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Cohort-Based Specific Fields */}
            {courseType === "cohort-based" && (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Cohort-Based Course Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cohortSize">Max Cohort Size</Label>
                        <Input
                          id="cohortSize"
                          type="number"
                          placeholder="e.g., 50"
                          value={formData.cohortSize}
                          onChange={(e) =>
                            setFormData({ ...formData, cohortSize: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="liveSessions">Live Sessions</Label>
                        <Input
                          id="liveSessions"
                          type="number"
                          placeholder="e.g., 16"
                          value={formData.liveSessions}
                          onChange={(e) =>
                            setFormData({ ...formData, liveSessions: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({ ...formData, endDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="schedule">Schedule</Label>
                      <Input
                        id="schedule"
                        placeholder="e.g., Mon & Wed, 7:00 PM - 9:00 PM"
                        value={formData.schedule}
                        onChange={(e) =>
                          setFormData({ ...formData, schedule: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="meetingPlatform">Meeting Platform</Label>
                      <Select
                        value={formData.meetingPlatform}
                        onValueChange={(value) =>
                          setFormData({ ...formData, meetingPlatform: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zoom">Zoom</SelectItem>
                          <SelectItem value="Google Meet">Google Meet</SelectItem>
                          <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCourse}>
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the details for your course
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Common Fields */}
            <div>
              <Label htmlFor="edit-title">Course Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Complete Web Development Masterclass"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-thumbnail">Course Thumbnail Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                <Input
                  id="edit-thumbnail"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setFormData({ ...formData, thumbnail: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="edit-thumbnail" className="cursor-pointer block">
                  {formData.thumbnail ? (
                    <div>
                      <img src={formData.thumbnail} alt="Thumbnail preview" className="w-20 h-20 object-cover mx-auto rounded mb-2" />
                      <p className="text-sm text-blue-600">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Click to upload course thumbnail</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="edit-description">Description</Label>
                <span className="text-sm text-gray-600">
                  {formData.description.length}/2000
                </span>
              </div>
              <Textarea
                id="edit-description"
                placeholder="Describe what students will learn"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 2000) {
                    setFormData({ ...formData, description: e.target.value });
                  }
                }}
                maxLength={2000}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Maximum 2000 characters allowed for course description
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger id="edit-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">💵 USD (United States Dollar) - Stripe</SelectItem>
                    <SelectItem value="INR">🇮🇳 INR (Indian Rupees) - Razorpay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  placeholder="99"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-endDate">End Date *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Cohort-Based Specific Fields */}
            {selectedCourse?.type === "cohort-based" && (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Cohort-Based Course Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-cohortSize">Max Cohort Size</Label>
                        <Input
                          id="edit-cohortSize"
                          type="number"
                          placeholder="e.g., 50"
                          value={formData.cohortSize}
                          onChange={(e) =>
                            setFormData({ ...formData, cohortSize: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-liveSessions">Live Sessions</Label>
                        <Input
                          id="edit-liveSessions"
                          type="number"
                          placeholder="e.g., 16"
                          value={formData.liveSessions}
                          onChange={(e) =>
                            setFormData({ ...formData, liveSessions: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-startDate">Start Date</Label>
                        <Input
                          id="edit-startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-endDate">End Date</Label>
                        <Input
                          id="edit-endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({ ...formData, endDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-schedule">Schedule</Label>
                      <Input
                        id="edit-schedule"
                        placeholder="e.g., Mon & Wed, 7:00 PM - 9:00 PM"
                        value={formData.schedule}
                        onChange={(e) =>
                          setFormData({ ...formData, schedule: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-meetingPlatform">Meeting Platform</Label>
                      <Select
                        value={formData.meetingPlatform}
                        onValueChange={(value) =>
                          setFormData({ ...formData, meetingPlatform: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zoom">Zoom</SelectItem>
                          <SelectItem value="Google Meet">Google Meet</SelectItem>
                          <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCourse}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Lessons Dialog */}
      <Dialog open={manageLessonsDialogOpen} onOpenChange={setManageLessonsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Course Lessons</DialogTitle>
            <DialogDescription>
              Add lessons with videos, files (PDF, Word, Excel), or both. Students will see these lessons after enrolling.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md space-y-3">
              <p className="text-sm font-semibold text-blue-900">📚 Add Course Lessons (Videos & Materials)</p>
              <div className="text-sm text-blue-800 space-y-2">
                <div className="bg-white p-3 rounded border border-green-300 border-dashed">
                  <strong className="text-green-700">✓ How to add lessons:</strong>
                  <p className="text-xs text-green-700 mt-2">
                    1. <strong>Lesson Title</strong> (required) - Name your lesson<br/>
                    2. <strong>Video URL</strong> (optional) - Video playback link<br/>
                    3. <strong>Course Materials</strong> (optional) - Upload PDF, Word docs, Excel, PowerPoint, Images, ZIP files
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    You can have a lesson with video only, materials only, or both!
                  </p>
                </div>
                
                <div>
                  <strong className="text-blue-900">📎 Course Materials - Upload Files</strong>
                  <p className="text-xs text-blue-700 mt-1 mb-2">
                    Click "Choose" to upload course materials directly. Supported formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), Images (JPG, PNG, GIF), ZIP archives. Maximum 100MB per file.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {lessons.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No lessons added yet. Click "Add Lesson" to get started.</p>
              ) : (
                lessons.map((lesson, index) => (
                  <Card key={index} className="p-6 bg-gradient-to-br from-white to-gray-50">
                    {/* Lesson Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="e.g., Introduction to React"
                            value={lesson.title}
                            onChange={(e) => updateLesson(index, "title", e.target.value)}
                            className="font-semibold text-base border-0 px-0 focus-visible:ring-0 focus-visible:border-b-2"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLesson(index)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Video Preview Section */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        🎬 Lesson Video
                        {lesson.cloudflareStreamId && (
                          <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                            ✓ Uploaded
                          </span>
                        )}
                      </p>
                      
                      {lesson.cloudflareStreamId ? (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-20 h-20 bg-green-200 rounded-lg flex items-center justify-center">
                              <span className="text-3xl">🎬</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-green-900">Video Uploaded</p>
                              <p className="text-xs text-green-700 mt-1">
                                Stream ID: <code className="bg-green-100 px-1 rounded text-xs font-mono">{lesson.cloudflareStreamId}</code>
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                Status: <span className="font-bold">{lesson.cloudflareStatus || 'ready'}</span>
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const updatedLessons = [...lessons];
                                  updatedLessons[index] = {
                                    ...updatedLessons[index],
                                    cloudflareStreamId: undefined,
                                    cloudflareStatus: undefined,
                                  };
                                  setLessons(updatedLessons);
                                }}
                                className="mt-3 text-xs border-green-300 hover:bg-green-100"
                              >
                                Remove Video
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition">
                          <div className="text-center">
                            <input
                              id={`video-upload-${index}`}
                              type="file"
                              accept=".mp4,.webm,.mov"
                              disabled={uploadingVideoFor === index}
                              onChange={(e) => {
                                const file = e.currentTarget.files?.[0];
                                if (file) {
                                  if (file.name.includes(' ')) {
                                    alert(
                                      "⚠️ Filename cannot contain spaces.\n\n" +
                                      "Please rename your video file and try again.\n\n" +
                                      "Example: 'MyVideo.mp4' instead of 'My Video.mp4'"
                                    );
                                    return;
                                  }
                                  if (file.size > 5 * 1024 * 1024 * 1024) {
                                    alert("File size must be under 5GB");
                                    return;
                                  }
                                  uploadVideoToCloudflare(index, file);
                                }
                              }}
                              className="hidden"
                            />
                            <div className="mb-2">
                              <span className="text-3xl">📤</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {uploadingVideoFor === index ? `Uploading... ${videoUploadProgress[index] || 0}%` : "Drag & drop your video or click to browse"}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              MP4, WebM, or MOV • Max 5GB
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => document.getElementById(`video-upload-${index}`)?.click()}
                              disabled={uploadingVideoFor === index}
                              className="bg-indigo-600 hover:bg-indigo-700"
                            >
                              {uploadingVideoFor === index ? "Uploading..." : "Upload Video"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Course Materials Section */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        📎 Course Materials
                        {lesson.files && lesson.files.length > 0 && (
                          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                            {lesson.files.length} file{lesson.files.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>

                      {/* Upload Input */}
                      <div className="mb-4">
                        <div className="flex gap-2 mb-2">
                          <input
                            id={`lesson-files-${index}`}
                            type="file"
                            multiple={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png,.gif"
                            className="flex-1 text-xs border rounded px-2 py-2 file:text-xs file:px-3 file:py-1 file:border file:border-gray-300 file:rounded file:bg-gray-50 hover:file:bg-gray-100"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0];
                              if (file) {
                                uploadFileToLesson(index, file);
                                e.currentTarget.value = '';
                              }
                            }}
                            disabled={uploadingFileFor === index}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => document.getElementById(`lesson-files-${index}`)?.click()}
                            disabled={uploadingFileFor === index}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {uploadingFileFor === index ? 'Adding...' : '+ Add'}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, PowerPoint, Images, ZIP • Max 100MB
                        </p>
                      </div>

                      {/* File Preview Cards */}
                      {lesson.files && lesson.files.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lesson.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="group relative bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition"
                            >
                              <div className="flex items-start gap-3">
                                {/* File Icon/Thumbnail */}
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  {file.fileType.includes('image') ? (
                                    <img
                                      src={file.fileUrl}
                                      alt={file.fileName}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  ) : (
                                    <span className="text-xl">{getFileIcon(file.fileType)}</span>
                                  )}
                                </div>
                                
                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate break-words">
                                    {file.fileName}
                                  </p>
                                  {file.fileSize && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Delete Button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteFileFromLesson(index, fileIndex)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-red-600 hover:bg-red-50 p-1 h-6 w-6"
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">No files added yet</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addLesson}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageLessonsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLessons}
              disabled={lessons.some(l => !l.title)}
            >
              Save Lessons
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollments Dialog */}
      <Dialog open={enrollmentsDialogOpen} onOpenChange={setEnrollmentsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Enrollments - {selectedCourse?.title}</DialogTitle>
            <DialogDescription>
              {enrollmentsLoading ? (
                <span>Loading enrollments...</span>
              ) : courseEnrollments.length === 0 ? (
                <span>No students enrolled yet</span>
              ) : (
                <span>{courseEnrollments.length} student{courseEnrollments.length !== 1 ? 's' : ''} enrolled</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {enrollmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading enrollments...</p>
              </div>
            </div>
          ) : courseEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No students have enrolled in this course yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-semibold">Email</th>
                      <th className="text-left py-2 px-3 font-semibold">Enrolled</th>
                      <th className="text-center py-2 px-3 font-semibold">Progress</th>
                      <th className="text-center py-2 px-3 font-semibold">Completion</th>
                      <th className="text-center py-2 px-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseEnrollments.map((enrollment) => (
                      <tr key={enrollment._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3">{enrollment.customerEmail}</td>
                        <td className="py-3 px-3 text-xs text-gray-600">
                          {new Date(enrollment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${enrollment.completionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-700 min-w-[45px] text-right">
                              {enrollment.completionPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                            backgroundColor: enrollment.completed ? '#d1fae5' : '#f3f4f6',
                            color: enrollment.completed ? '#065f46' : '#6b7280'
                          }}>
                            {enrollment.completedLessons}/{enrollment.totalLessons}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">
                          {enrollment.amount > 0 ? `$${enrollment.amount}` : 'Free'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollmentsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
