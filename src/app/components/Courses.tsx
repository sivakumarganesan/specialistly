import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { courseAPI, API_BASE_URL } from "@/app/api/apiClient";
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
        const response = await courseAPI.getAll({ creator: user?.email });
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
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseType, setCourseType] = useState<"self-paced" | "cohort-based" | null>(null);

  interface Lesson {
    _id?: string;
    title: string;
    videoUrl?: string; // Optional - can have just files
    order: number;
    files?: LessonFile[];
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
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadingFileFor, setUploadingFileFor] = useState<number | null>(null);
  const [selectedFilesByLesson, setSelectedFilesByLesson] = useState<{ [key: number]: File[] }>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    level: "Beginner",
    category: "Technology",
    // Self-paced specific fields
    totalLessons: "",
    certificateIncluded: true,
    accessDuration: "Lifetime",
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
      // Remove _id from modules to let backend generate them
      const modulesData = modules.map(({ id, ...rest }) => rest);
      const courseData = {
        title: formData.title,
        courseType: courseType,
        description: formData.description,
        price: parseInt(formData.price) || 0,
        duration: formData.duration,
        status: "draft",
        level: formData.level,
        category: formData.category,
        specialistId: user?.id,
        specialistEmail: user?.email,
        ...(courseType === "self-paced" && {
          totalLessons: parseInt(formData.totalLessons) || 0,
          certificateIncluded: formData.certificateIncluded,
          accessDuration: formData.accessDuration,
          modules: modulesData,
        }),
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
        price: parseInt(formData.price) || 0,
        duration: formData.duration,
        level: formData.level,
        category: formData.category,
        specialistId: user?.id,
        specialistEmail: user?.email,
        ...(selectedCourse.type === "self-paced" && {
          totalLessons: parseInt(formData.totalLessons) || 0,
          certificateIncluded: formData.certificateIncluded,
          accessDuration: formData.accessDuration,
          modules: modulesData,
        }),
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

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      price: course.price || "",
      duration: course.duration || "",
      level: course.level || "Beginner",
      category: course.category || "Technology",
      totalLessons: course.totalLessons?.toString() || "",
      certificateIncluded: course.certificateIncluded !== undefined ? course.certificateIncluded : true,
      accessDuration: course.accessDuration || "Lifetime",
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
      price: "",
      duration: "",
      level: "Beginner",
      category: "Technology",
      totalLessons: "",
      certificateIncluded: true,
      accessDuration: "Lifetime",
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
      videoUrl: "",
      order: lessons.length + 1,
    };
    setLessons([...lessons, newLesson]);
  };

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string | number) => {
    let finalValue = value;
    
    // Auto-convert YouTube URLs to embed format
    if (field === "videoUrl" && typeof value === "string") {
      finalValue = convertToEmbedUrl(value);
    }
    
    setLessons(
      lessons.map((lesson, i) =>
        i === index ? { ...lesson, [field]: finalValue } : lesson
      )
    );
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

  const generateDriveLinks = (fileId: string) => {
    return {
      downloadLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
      viewLink: `https://drive.google.com/file/d/${fileId}/view`,
    };
  };

  const extractFileName = (url: string, providedName?: string): string => {
    if (providedName) return providedName;
    
    // Extract file ID from URL
    let fileId = '';
    if (url.includes('/d/')) {
      fileId = url.split('/d/')[1]?.split('/')[0] || '';
    } else if (url.includes('id=')) {
      fileId = new URL(url).searchParams.get('id') || '';
    } else {
      fileId = url;
    }
    
    // Determine file type from URL
    if (url.includes('docs.google.com/document')) {
      return `Google_Document_${fileId.substring(0, 8)}`;
    } else if (url.includes('docs.google.com/spreadsheets')) {
      return `Google_Sheet_${fileId.substring(0, 8)}`;
    } else if (url.includes('docs.google.com/presentation')) {
      return `Google_Slides_${fileId.substring(0, 8)}`;
    } else {
      return `Google_File_${fileId.substring(0, 8)}`;
    }
  };

  const addGoogleDriveFile = async (lessonIndex: number, googleDriveUrl: string, fileName?: string) => {
    if (!selectedCourse || !googleDriveUrl.trim()) {
      alert("Please provide a valid Google Drive URL or file ID");
      return;
    }

    const lesson = lessons[lessonIndex];

    try {
      // If lesson doesn't have an ID yet, we can't attach files through the API
      if (!lesson._id) {
        // For new lessons, we'll add files locally and send them with the lesson creation
        const displayName = extractFileName(googleDriveUrl, fileName);
        
        if (!lesson.files) {
          lesson.files = [];
        }
        
        // Create a temporary file object
        const fileId = googleDriveUrl.includes('id=') 
          ? new URL(googleDriveUrl).searchParams.get('id') || googleDriveUrl
          : googleDriveUrl.split('/d/')[1]?.split('/')[0] || googleDriveUrl;
        const { downloadLink, viewLink } = generateDriveLinks(fileId);
        
        const tempFile: LessonFile = {
          fileName: displayName,
          fileUrl: googleDriveUrl.trim(),
          fileType: getFileType(displayName),
          googleDriveFileId: fileId,
          downloadLink,
          viewLink,
          uploadedAt: new Date().toISOString(),
        };
        
        if (!lesson.files.find(f => f.fileUrl === tempFile.fileUrl)) {
          lesson.files.push(tempFile);
          setLessons([...lessons]);
          alert(`✓ File "${displayName}" added to lesson. It will be uploaded when you save the course.`);
        }
        return;
      }

      // For existing lessons, call the backend API
      const displayName = extractFileName(googleDriveUrl, fileName);

      const response = await fetch(
        `${API_BASE_URL}/courses/${selectedCourse.id}/lessons/${lesson._id}/files`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            googleDriveUrl: googleDriveUrl.trim(),
            fileName: displayName,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add file');
      }

      const data = await response.json();
      
      if (!lesson.files) {
        lesson.files = [];
      }
      
      if (!lesson.files.find(f => f.googleDriveFileId === data.file.googleDriveFileId)) {
        lesson.files.push(data.file);
        setLessons([...lessons]);
        alert(`✓ File "${displayName}" added successfully from Google Drive!`);
      } else {
        alert("This file is already attached to the lesson");
      }
    } catch (error) {
      console.error("Error adding Google Drive file:", error);
      alert(`Failed to add file: ${error instanceof Error ? error.message : 'Please try again'}`);
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

  const convertToEmbedUrl = (url: string): string => {
    if (!url.trim()) return "";
    
    url = url.trim();
    
    // Google Drive embed URL - already in preview format
    if (url.includes("drive.google.com/file/") && url.includes("/preview")) {
      return url.startsWith("https://") ? url : url.replace("http://", "https://");
    }
    
    // Google Drive view URL - convert to preview format
    if (url.includes("drive.google.com/file/")) {
      // Extract file ID: https://drive.google.com/file/d/FILE_ID/view
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match?.[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    
    // Google Drive open URL - convert to preview format
    if (url.includes("drive.google.com/open?id=")) {
      const match = url.match(/id=([a-zA-Z0-9-_]+)/);
      if (match?.[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    
    // Already a modern embed URL - ensure https
    if (url.includes("youtube.com/embed/")) {
      return url.startsWith("https://") ? url : url.replace("http://", "https://");
    }
    if (url.includes("youtube-nocookie.com/embed/")) {
      return url.startsWith("https://") ? url : url.replace("http://", "https://");
    }
    if (url.includes("player.vimeo.com/video/")) {
      return url.startsWith("https://") ? url : url.replace("http://", "https://");
    }
    
    // Extract video ID from various YouTube formats
    let videoId = null;
    
    // YouTube watch URL: youtube.com/watch?v=VIDEO_ID or www.youtube.com/watch?v=VIDEO_ID
    if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
      try {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v");
      } catch (e) {
        // If URL fails to parse, try regex
        const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        videoId = match?.[1] || null;
      }
    }
    
    // YouTube short URL: youtu.be/VIDEO_ID
    if (!videoId && url.includes("youtu.be/")) {
      const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      videoId = match?.[1] || null;
    }
    
    // Return converted YouTube URL
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo extraction
    let vimeoId = null;
    if (url.includes("vimeo.com")) {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      vimeoId = match?.[1] || null;
    }
    
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
    
    // If it looks like an embed URL already, ensure https
    if (url.includes("embed") || url.includes("player")) {
      return url.startsWith("https://") ? url : url.replace("http://", "https://");
    }
    
    // Return original if we can't convert it
    return url;
  };

  const openManageLessonsDialog = (course: Course) => {
    setSelectedCourse(course);
    // Initialize lessons from course if they exist
    if (course.lessons && Array.isArray(course.lessons)) {
      setLessons(course.lessons.map((l: any, idx) => ({
        _id: l._id,
        title: l.title,
        videoUrl: l.videoUrl,
        order: idx + 1,
      })));
    } else {
      setLessons([]);
    }
    setManageLessonsDialogOpen(true);
  };

  const handleSaveLessons = async () => {
    if (!selectedCourse) return;

    // Validate all lessons have title (videoUrl is now optional)
    const invalidLessons = lessons.filter(l => !l.title);
    if (invalidLessons.length > 0) {
      alert("Please fill in all lesson titles. You can add videos and files optionally.");
      return;
    }

    try {
      // Add new lessons that don't have _id
      for (const lesson of lessons) {
        if (!lesson._id) {
          // Prepare video URL if provided
          let finalUrl = null;
          if (lesson.videoUrl) {
            finalUrl = convertToEmbedUrl(lesson.videoUrl);
            
            if (!finalUrl.includes("youtube.com/embed/") && 
                !finalUrl.includes("player.vimeo.com/") &&
                !finalUrl.includes("drive.google.com/file/") &&
                !finalUrl.includes("/embed/")) {
              console.warn(`Video URL may not be valid: ${finalUrl}`);
            }
          }
          
          await courseAPI.addLesson(selectedCourse.id, {
            title: lesson.title,
            videoUrl: finalUrl,
            files: lesson.files || [],
            order: lesson.order,
          });
        }
      }
      
      setManageLessonsDialogOpen(false);
      setVideoPreviewUrl(null);
      setSelectedFilesByLesson({});
      alert("✓ Lessons saved successfully!");
      
      // Refresh courses
      const response = await courseAPI.getAll({ creator: user?.email });
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

  const testVideoUrl = (url: string) => {
    setVideoPreviewUrl(convertToEmbedUrl(url));
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
                    <span className="font-semibold">{course.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-semibold">{course.studentsEnrolled}</span>
                  </div>
                  {course.type === "self-paced" && course.totalLessons && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lessons:</span>
                      <span className="font-semibold">{course.totalLessons}</span>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  placeholder="$99"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 8 weeks"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Course Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="All Levels">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Personal Development">Personal Development</SelectItem>
                    <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Self-Paced Specific Fields */}
            {courseType === "self-paced" && (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Self-Paced Course Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalLessons">Total Lessons</Label>
                        <Input
                          id="totalLessons"
                          type="number"
                          placeholder="e.g., 48"
                          value={formData.totalLessons}
                          onChange={(e) =>
                            setFormData({ ...formData, totalLessons: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="accessDuration">Access Duration</Label>
                        <Select
                          value={formData.accessDuration}
                          onValueChange={(value) =>
                            setFormData({ ...formData, accessDuration: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select access duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lifetime">Lifetime Access</SelectItem>
                            <SelectItem value="1 Year">1 Year</SelectItem>
                            <SelectItem value="6 Months">6 Months</SelectItem>
                            <SelectItem value="3 Months">3 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="certificate"
                        checked={formData.certificateIncluded}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, certificateIncluded: checked as boolean })
                        }
                      />
                      <Label htmlFor="certificate" className="cursor-pointer">
                        Include certificate of completion
                      </Label>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Course Modules</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addModule}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Module
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {modules.map((module, index) => (
                          <Card key={module.id} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Module {index + 1}</span>
                                {modules.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeModule(module.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                placeholder="Module title"
                                value={module.title}
                                onChange={(e) =>
                                  updateModule(module.id, "title", e.target.value)
                                }
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Duration (e.g., 2 hours)"
                                  value={module.duration}
                                  onChange={(e) =>
                                    updateModule(module.id, "duration", e.target.value)
                                  }
                                />
                                <Input
                                  type="number"
                                  placeholder="Lessons count"
                                  value={module.lessonsCount || ""}
                                  onChange={(e) =>
                                    updateModule(module.id, "lessonsCount", parseInt(e.target.value) || 0)
                                  }
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what students will learn"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  placeholder="$99"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-duration">Duration *</Label>
                <Input
                  id="edit-duration"
                  placeholder="e.g., 8 weeks"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-level">Course Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="All Levels">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Personal Development">Personal Development</SelectItem>
                    <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Self-Paced Specific Fields */}
            {selectedCourse?.type === "self-paced" && (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Self-Paced Course Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-totalLessons">Total Lessons</Label>
                        <Input
                          id="edit-totalLessons"
                          type="number"
                          placeholder="e.g., 48"
                          value={formData.totalLessons}
                          onChange={(e) =>
                            setFormData({ ...formData, totalLessons: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-accessDuration">Access Duration</Label>
                        <Select
                          value={formData.accessDuration}
                          onValueChange={(value) =>
                            setFormData({ ...formData, accessDuration: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select access duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lifetime">Lifetime Access</SelectItem>
                            <SelectItem value="1 Year">1 Year</SelectItem>
                            <SelectItem value="6 Months">6 Months</SelectItem>
                            <SelectItem value="3 Months">3 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="edit-certificate"
                        checked={formData.certificateIncluded}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, certificateIncluded: checked as boolean })
                        }
                      />
                      <Label htmlFor="edit-certificate" className="cursor-pointer">
                        Include certificate of completion
                      </Label>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Course Modules</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addModule}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Module
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {modules.map((module, index) => (
                          <Card key={module.id} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Module {index + 1}</span>
                                {modules.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeModule(module.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                placeholder="Module title"
                                value={module.title}
                                onChange={(e) =>
                                  updateModule(module.id, "title", e.target.value)
                                }
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Duration (e.g., 2 hours)"
                                  value={module.duration}
                                  onChange={(e) =>
                                    updateModule(module.id, "duration", e.target.value)
                                  }
                                />
                                <Input
                                  type="number"
                                  placeholder="Lessons count"
                                  value={module.lessonsCount || ""}
                                  onChange={(e) =>
                                    updateModule(module.id, "lessonsCount", parseInt(e.target.value) || 0)
                                  }
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

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
              <p className="text-sm font-semibold text-blue-900">📚 Add Course Lessons (Videos & Files)</p>
              <div className="text-sm text-blue-800 space-y-2">
                <div className="bg-white p-3 rounded border border-green-300 border-dashed">
                  <strong className="text-green-700">✓ Easy method:</strong>
                  <p className="text-xs text-green-700 mt-1">
                    Add lesson title (required) + video URL (optional) + files (optional). You can have lesson with video only, files only, or both!
                  </p>
                  <ul className="text-xs text-green-700 ml-4 mt-2 list-disc space-y-1">
                    <li>Regular YouTube: <code className="bg-green-100 px-1 rounded">youtube.com/watch?v=VIDEO_ID</code></li>
                    <li>YouTube short: <code className="bg-green-100 px-1 rounded">youtu.be/VIDEO_ID</code></li>
                    <li>Vimeo: <code className="bg-green-100 px-1 rounded">vimeo.com/VIDEO_ID</code></li>
                    <li>Google Drive: <code className="bg-green-100 px-1 rounded">drive.google.com/file/d/FILE_ID/view</code></li>
                    <li>Files: <code className="bg-green-100 px-1 rounded">PDF, Word, Excel, PowerPoint, ZIP</code></li>
                  </ul>
                </div>
                
                <div>
                  <strong>If auto-conversion doesn't work, use these directly:</strong>
                  <div>
                    <strong className="text-blue-900">YouTube:</strong>
                    <div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                      https://www.youtube.com/embed/VIDEO_ID
                    </div>
                  </div>
                  <div className="mt-2">
                    <strong className="text-blue-900">Vimeo:</strong>
                    <div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                      https://player.vimeo.com/video/VIDEO_ID
                    </div>
                  </div>
                  <div className="mt-2">
                    <strong className="text-blue-900">Google Drive:</strong>
                    <div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
                      https://drive.google.com/file/d/FILE_ID/preview
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {lessons.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No lessons added yet. Click "Add Lesson" to get started.</p>
              ) : (
                lessons.map((lesson, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Lesson {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLesson(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor={`lesson-title-${index}`} className="text-xs">
                          Lesson Title *
                        </Label>
                        <Input
                          id={`lesson-title-${index}`}
                          placeholder="e.g., Introduction to React"
                          value={lesson.title}
                          onChange={(e) => updateLesson(index, "title", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`lesson-url-${index}`} className="text-xs">
                          Video URL (Optional)
                        </Label>
                        <Input
                          id={`lesson-url-${index}`}
                          placeholder="Paste any YouTube/Vimeo URL - we'll auto-convert it!"
                          value={lesson.videoUrl || ""}
                          onChange={(e) => updateLesson(index, "videoUrl", e.target.value)}
                        />
                        {lesson.videoUrl && (
                          <div className="mt-2 space-y-2">
                            <div className="p-2 bg-gray-50 rounded border border-gray-200">
                              <p className="text-xs text-gray-600 mb-2">
                                <strong>Will be converted to:</strong>
                              </p>
                              <div className="font-mono text-xs bg-white p-1 rounded break-all text-green-700 mb-2">
                                {convertToEmbedUrl(lesson.videoUrl)}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => testVideoUrl(lesson.videoUrl)}
                                className="w-full text-xs"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Test Video
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Upload Section */}
                      <div className="border-t pt-3">
                        <Label htmlFor={`lesson-files-${index}`} className="text-xs">
                          📎 Lesson Files from Google Drive - Optional
                        </Label>
                        <div className="mt-2 space-y-3">
                          <div className="flex gap-2">
                            <input
                              id={`lesson-files-${index}`}
                              type="text"
                              placeholder="Paste Google Drive file ID or shareable link"
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const url = (e.target as HTMLInputElement).value;
                                  if (url.trim()) {
                                    addGoogleDriveFile(index, url);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const input = document.getElementById(`lesson-files-${index}`) as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  addGoogleDriveFile(index, input.value);
                                  input.value = '';
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Add File
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Example: https://drive.google.com/file/d/FILE_ID/view or just FILE_ID
                          </p>
                        </div>

                        {/* Display files attached to this lesson */}
                        {lesson.files && lesson.files.length > 0 && (
                          <div className="mt-3 space-y-2 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900">Attached Files:</p>
                            {lesson.files.map((file, fileIndex) => (
                              <div
                                key={fileIndex}
                                className="flex items-center justify-between p-2 bg-white rounded border border-blue-100"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-lg">{getFileIcon(file.fileType)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {file.fileName}
                                    </p>
                                    {file.fileSize && (
                                      <p className="text-xs text-gray-500">
                                        {(file.fileSize / 1024).toFixed(1)} KB
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFileFromLesson(index, fileIndex)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {videoPreviewUrl && (
              <Card className="mt-4 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Video Preview</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoPreviewUrl(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded aspect-video flex items-center justify-center overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={videoPreviewUrl}
                      title="Video Preview"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                  </div>
                  {videoPreviewUrl && (
                    <p className="text-xs text-gray-600">
                      <strong>Playing:</strong> <span className="break-all">{videoPreviewUrl}</span>
                    </p>
                  )}
                </div>
              </Card>
            )}

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
              disabled={lessons.some(l => !l.title || !l.videoUrl)}
            >
              Save Lessons
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
