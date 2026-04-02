import { useState, useEffect, useRef } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { HLSVideoPlayer } from "@/app/components/HLSVideoPlayer";
import { courseAPI, videoAPI, couponAPI, API_BASE_URL } from "@/app/api/apiClient";
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
  Tag,
  Bell,
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
  zoomLink?: string;
  zoomStartUrl?: string;
  liveSessions?: number;
  purchaseNote?: string;
}

interface SearchableItem {
  id: string;
  title: string;
  type: "course" | "offering";
}

interface CoursesProps {
  onUpdateSearchableItems: (items: SearchableItem[]) => void;
  embedded?: boolean;
}

export function Courses({ onUpdateSearchableItems, embedded }: CoursesProps) {
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
            thumbnail: course.thumbnail || "",
            price: course.price?.toString() || "",
            currency: course.currency || "USD",
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
            zoomLink: course.zoomLink || "",
            zoomStartUrl: course.zoomStartUrl || "",
            liveSessions: course.liveSessions,
            purchaseNote: course.purchaseNote || "",
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

  // Coupon management state
  const [couponsDialogOpen, setCouponsDialogOpen] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: '', maxRedemptions: '', expiresAt: '' });
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const openCouponsDialog = async (course: Course) => {
    setSelectedCourse(course);
    setCouponsDialogOpen(true);
    setCouponsLoading(true);
    setCouponError(null);
    try {
      const data = await couponAPI.getAll(course.id);
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!selectedCourse || !couponForm.code || !couponForm.discountValue) return;
    setCouponSaving(true);
    setCouponError(null);
    try {
      const payload: any = {
        code: couponForm.code.trim().toUpperCase(),
        course: selectedCourse.id,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
      };
      if (couponForm.maxRedemptions) payload.maxRedemptions = Number(couponForm.maxRedemptions);
      if (couponForm.expiresAt) payload.expiresAt = couponForm.expiresAt;
      const newCoupon = await couponAPI.create(payload);
      setCoupons((prev) => [...prev, newCoupon]);
      setCouponForm({ code: '', discountType: 'percentage', discountValue: '', maxRedemptions: '', expiresAt: '' });
    } catch (err: any) {
      setCouponError(err.message || 'Failed to create coupon');
    } finally {
      setCouponSaving(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await couponAPI.delete(couponId);
      setCoupons((prev) => prev.filter((c) => c._id !== couponId));
    } catch (err: any) {
      setCouponError(err.message || 'Failed to delete coupon');
    }
  };

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
  
  // Preview states
  const [previewLessonIndex, setPreviewLessonIndex] = useState<number | null>(null);
  const [previewFileIndex, setPreviewFileIndex] = useState<number | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewHlsUrl, setPreviewHlsUrl] = useState<string | null>(null);
  const [loadingPreviewVideo, setLoadingPreviewVideo] = useState(false);

  // File input refs for resetting
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    price: "",
    currency: "INR",
    duration: "",
    // Cohort-based specific fields
    cohortSize: "",
    startDate: "",
    endDate: "",
    schedule: "",
    meetingPlatform: "Zoom",
    zoomLink: "",
    liveSessions: "",
    purchaseNote: "",
  });

  const [modules, setModules] = useState<Module[]>([
    { id: "1", title: "Introduction to Course", duration: "2 hours", lessonsCount: 5 },
  ]);

  const [creatingCourse, setCreatingCourse] = useState(false);
  const handleCreateCourse = async () => {
    if (creatingCourse) return;
    if (courseType && formData.title) {
      setCreatingCourse(true);
      const courseData = {
        title: formData.title,
        courseType: courseType,
        description: formData.description,
        thumbnail: formData.thumbnail || "",
        price: parseInt(formData.price) || 0,
        currency: formData.currency || "USD",
        duration: formData.duration,
        purchaseNote: formData.purchaseNote || "",
        startDate: formData.startDate || "",
        endDate: formData.endDate || "",
        status: "draft",
        specialistId: user?.id,
        specialistEmail: user?.email,
        ...(courseType === "cohort-based" && {
          cohortSize: formData.cohortSize,
          schedule: formData.schedule,
          meetingPlatform: formData.meetingPlatform,
          zoomLink: formData.zoomLink,
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
      } finally {
        setCreatingCourse(false);
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
        startDate: formData.startDate || "",
        endDate: formData.endDate || "",
        purchaseNote: formData.purchaseNote || "",
        specialistId: user?.id,
        specialistEmail: user?.email,
        ...((selectedCourse.type === "cohort-based" || selectedCourse.type === "cohort") && {
          cohortSize: formData.cohortSize,
          schedule: formData.schedule,
          meetingPlatform: formData.meetingPlatform,
          zoomLink: formData.zoomLink,
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
        let result: any;
        if (newStatus === "published") {
          result = await courseAPI.publishCourse(id);
        } else {
          result = await courseAPI.update(id, { status: newStatus });
        }
        setCourses(
          courses.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: newStatus,
                  zoomLink: result?.data?.zoomLink || c.zoomLink,
                  zoomStartUrl: result?.data?.zoomStartUrl || c.zoomStartUrl,
                }
              : c
          )
        );
        const msg = newStatus === 'published' 
          ? (result?.zoomMeetingCreated 
              ? '✓ Course published! Zoom meeting link created automatically.' 
              : '✓ Course published successfully!')
          : '✓ Course unpublished.';
        alert(msg);
      } catch (error) {
        console.error("Failed to update course status:", error);
        alert(`Failed to update course status: ${error instanceof Error ? error.message : "Please try again."}`);
      }
    }
  };

  const handleGenerateZoom = async (id: string) => {
    try {
      const result = await courseAPI.generateZoomMeeting(id);
      if (result?.success) {
        setCourses(
          courses.map((c) =>
            c.id === id
              ? { ...c, zoomLink: result.zoomLink, zoomStartUrl: result.zoomStartUrl, meetingPlatform: 'zoom' }
              : c
          )
        );
        alert('✓ Zoom meeting link created successfully!');
      }
    } catch (error) {
      console.error("Failed to generate Zoom meeting:", error);
      alert(`Failed to generate Zoom meeting: ${error instanceof Error ? error.message : "Please try again."}`);
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
    // Convert ISO dates to YYYY-MM-DD for date inputs
    const formatDate = (d: string) => {
      if (!d) return "";
      try { return new Date(d).toISOString().split('T')[0]; } catch { return ""; }
    };
    setFormData({
      title: course.title || "",
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      price: course.price || "",
      currency: course.currency || "USD",
      duration: course.duration || "",
      cohortSize: course.cohortSize || "",
      startDate: formatDate(course.startDate || ""),
      endDate: formatDate(course.endDate || ""),
      schedule: course.schedule || "",
      meetingPlatform: course.meetingPlatform || "Zoom",
      zoomLink: course.zoomLink || "",
      liveSessions: course.liveSessions?.toString() || "",
      purchaseNote: course.purchaseNote || "",
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
      currency: "INR",
      duration: "",
      cohortSize: "",
      startDate: "",
      endDate: "",
      schedule: "",
      meetingPlatform: "Zoom",
      zoomLink: "",
      liveSessions: "",
      purchaseNote: "",
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
    let uploadedStreamId: string | null = null;
    
    try {
      if (!selectedCourse) {
        throw new Error("No course selected");
      }

      const lesson = lessons[lessonIndex];
      if (!lesson || !lesson.title?.trim()) {
        alert("Please enter a lesson title before uploading a video.");
        return;
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
      uploadedStreamId = streamId;

      // Step 2: Upload video using TUS resumable upload (supports large files)
      const tus = await import("tus-js-client");
      const TusUpload = tus.Upload || tus.default?.Upload;

      await new Promise<void>((resolve, reject) => {
        const upload = new TusUpload(file, {
          uploadUrl: uploadUrl,   // Use uploadUrl (not endpoint) since we already have the URL
          chunkSize: 50 * 1024 * 1024, // 50MB chunks
          retryDelays: [0, 1000, 3000, 5000],
          metadata: {
            filename: file.name,
            filetype: file.type,
          },
          onError: (error: Error) => {
            console.error("TUS upload error:", error);
            reject(new Error(`Upload failed: ${error.message}`));
          },
          onProgress: (bytesUploaded: number, bytesTotal: number) => {
            const pct = Math.round((bytesUploaded / bytesTotal) * 95);
            setVideoUploadProgress((prev) => ({ ...prev, [lessonIndex]: pct }));
          },
          onSuccess: () => {
            resolve();
          },
        });
        upload.start();
      });

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
      
      // Even if TUS reports an error, the video may have been received by Cloudflare.
      // Save the streamId so the user can check status later.
      if (uploadedStreamId) {
        const updatedLessons = [...lessons];
        updatedLessons[lessonIndex] = {
          ...updatedLessons[lessonIndex],
          cloudflareStreamId: uploadedStreamId,
          cloudflareStatus: "pending",
        };
        setLessons(updatedLessons);
        alert(
          `⚠️ Upload completed with a warning: ${error instanceof Error ? error.message : "Unknown error"}\n\n` +
          "The video may still be processing in Cloudflare. Save the lesson and check back in a few minutes."
        );
      } else {
        alert(
          `Video upload failed: ${error instanceof Error ? error.message : "Please try again."}`
        );
      }
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

    if (!lesson || !lesson.title?.trim()) {
      alert("Please enter a lesson title before uploading materials.");
      return;
    }

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

  const handlePreviewVideo = async (lessonIndex: number) => {
    try {
      setPreviewLessonIndex(lessonIndex);
      setLoadingPreviewVideo(true);
      
      const lesson = lessons[lessonIndex];
      if (!lesson.cloudflareStreamId) {
        alert("No video available for preview");
        return;
      }

      // If lesson has already been saved, fetch the HLS URL from the server
      if (lesson._id && selectedCourse?.id) {
        try {
          const response = await videoAPI.getLessonVideo(selectedCourse.id, lesson._id);
          if (response?.success && response.video?.hlsUrl) {
            setPreviewHlsUrl(response.video.hlsUrl);
            setShowVideoPreview(true);
            return;
          }
        } catch (err) {
          console.warn("Could not fetch video from API, trying backend endpoint:", err);
        }
      }

      // Fallback: Get video details directly from Cloudflare via backend
      try {
        const videoDetails = await videoAPI.getVideoDetails(lesson.cloudflareStreamId);
        if (videoDetails?.success && videoDetails.video) {
          const hlsUrl = videoDetails.video.hlsPlaybackUrl || videoDetails.video.hlsUrl;
          if (hlsUrl) {
            setPreviewHlsUrl(hlsUrl);
            setShowVideoPreview(true);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch video details:", err);
      }
      
      alert("Video is still being processed or not available yet. Please try again in a moment.");
      
      setShowVideoPreview(true);
    } catch (error) {
      console.error("Error loading video preview:", error);
      alert("Failed to load video preview. The video may still be processing.");
    } finally {
      setLoadingPreviewVideo(false);
    }
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
        } else if (typeof lesson._id === 'string' && lesson._id.length === 24) {
          // UPDATE EXISTING lessons
          // First, update lesson title and files
          try {
            await courseAPI.updateLesson(selectedCourse.id, lesson._id, {
              title: lesson.title,
              files: lesson.files || [],
              order: lesson.order,
            });
          } catch (updateError) {
            console.error(`Lesson update error for lesson ${lesson.title}:`, updateError);
            // Don't fail the whole save if lesson metadata update fails
          }

          // Then handle video save or clear
          if (lesson.cloudflareStreamId) {
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
          } else {
            // Handle video removal (if cloudflareStreamId is now empty/undefined)
            try {
              await videoAPI.clearLessonVideo({
                courseId: selectedCourse.id,
                lessonId: lesson._id,
              });
            } catch (videoClearError) {
              console.error(`Video clear error for lesson ${lesson.title}:`, videoClearError);
              // Don't fail the whole save if video clear fails
            }
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
        return "bg-gray-100 text-gray-900";
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
    <div className={embedded ? "space-y-6" : "p-4 md:p-6 space-y-6"}>
      {/* Header */}
      {!embedded && (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Courses</h1>
          <p className="text-gray-600">
            Create and manage your course offerings
          </p>
        </div>
      </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-gray-900" />
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
            className="p-6 cursor-pointer hover:shadow-lg transition-all hover:border-gray-400"
            onClick={() => openCreateDialog("cohort-based")}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-gray-100 rounded-full">
                <Users className="h-8 w-8 text-gray-900" />
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
              <Button className="bg-gray-900 hover:bg-gray-800 gap-2">
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

                {/* Certificate included text removed as per request */}

                {course.type === "cohort-based" && course.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">
                      Starts: {new Date(course.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {course.type === "cohort-based" && course.zoomLink && (
                  <div className="space-y-2">
                    <a
                      href={course.zoomStartUrl || course.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition font-medium w-full justify-center"
                    >
                      <Video className="h-4 w-4" />
                      Start / Host Meeting
                    </a>
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      <span className="truncate">Join link: {course.zoomLink}</span>
                    </div>
                  </div>
                )}

                {course.type === "cohort-based" && !course.zoomLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => handleGenerateZoom(course.id)}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Generate Meeting Link
                  </Button>
                )}

                {course.type === "self-paced" && course.status === "draft" && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-sm text-blue-700 font-medium">
                      📚 Start adding lessons to build your course
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
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
                    onClick={() => openCouponsDialog(course)}
                    title="Manage coupon codes for this course"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    Coupons
                  </Button>
                  {course.type === "cohort-based" && course.status === "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Send a reminder email to all enrolled students for "${course.title}"?`)) return;
                        try {
                          const result = await courseAPI.sendReminder(course.id);
                          alert(`✓ ${result.message || 'Reminders sent!'}`);
                        } catch (error) {
                          alert(`Failed to send reminders: ${error instanceof Error ? error.message : 'Please try again.'}`);
                        }
                      }}
                      title="Send reminder email to all enrolled students"
                      className="text-indigo-600 hover:bg-indigo-50"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Remind
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

            {courseType === "cohort-based" && (
              <div>
                <Label htmlFor="zoomLink">Meeting Link</Label>
                <Input
                  id="zoomLink"
                  placeholder="e.g., https://zoom.us/j/... or https://meet.google.com/..."
                  value={formData.zoomLink}
                  onChange={(e) =>
                    setFormData({ ...formData, zoomLink: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Paste your Zoom, Google Meet, or any video meeting link. Students will see this after enrollment.</p>
              </div>
            )}

            <div>
              <Label htmlFor="purchaseNote">Purchase Note</Label>
              <Textarea
                id="purchaseNote"
                placeholder="e.g., Please join our WhatsApp group at... / Download materials from..."
                value={formData.purchaseNote}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseNote: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">This note will be included in the purchase confirmation email sent to students.</p>
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCourse} disabled={creatingCourse}>
              {creatingCourse ? 'Creating...' : 'Create Course'}
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

            {selectedCourse?.type === "cohort-based" && (
              <div>
                <Label htmlFor="edit-zoomLink">Meeting Link</Label>
                <Input
                  id="edit-zoomLink"
                  placeholder="e.g., https://zoom.us/j/... or https://meet.google.com/..."
                  value={formData.zoomLink}
                  onChange={(e) =>
                    setFormData({ ...formData, zoomLink: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Paste your Zoom, Google Meet, or any video meeting link. Students will see this after enrollment.</p>
              </div>
            )}

            <div>
              <Label htmlFor="edit-purchaseNote">Purchase Note</Label>
              <Textarea
                id="edit-purchaseNote"
                placeholder="e.g., Please join our WhatsApp group at... / Download materials from..."
                value={formData.purchaseNote}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseNote: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">This note will be included in the purchase confirmation email sent to students.</p>
            </div>

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
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            Lesson Title <span className="text-red-500">*</span>
                          </label>
                          <Input
                            placeholder="e.g., Introduction to React"
                            value={lesson.title}
                            onChange={(e) => updateLesson(index, "title", e.target.value)}
                            className={`font-semibold text-lg h-11 ${
                              !lesson.title?.trim() ? 'border-red-300 focus-visible:ring-red-400' : 'border-gray-300'
                            }`}
                          />
                          {!lesson.title?.trim() && (
                            <p className="text-xs text-red-500 mt-1">Title is required before uploading videos or materials</p>
                          )}
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
                              <div className="flex gap-2 mt-3">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handlePreviewVideo(index)}
                                  disabled={loadingPreviewVideo}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                  👁️ Preview
                                </Button>
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
                                  className="text-xs border-green-300 hover:bg-green-100"
                                >
                                  ✕
                                </Button>
                              </div>
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
                              disabled={uploadingVideoFor === index || !lesson.title?.trim()}
                              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                              title={!lesson.title?.trim() ? 'Enter a lesson title first' : ''}
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
                            ref={(el) => {
                              if (el) fileInputRefs.current[index] = el;
                            }}
                            id={`lesson-files-${index}`}
                            type="file"
                            multiple={false}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png,.gif,.mp3,.m4a,.aac,.wav,.ogg,.flac"
                            className="flex-1 text-xs border rounded px-2 py-2 file:text-xs file:px-3 file:py-1 file:border file:border-gray-300 file:rounded file:bg-gray-50 hover:file:bg-gray-100"
                            onChange={async (e) => {
                              const file = e.currentTarget.files?.[0];
                              if (!file) return;
                              // Audio file types
                              const audioTypes = [
                                'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/x-flac',
                              ];
                              if (audioTypes.includes(file.type)) {
                                // Validate size (100MB max)
                                if (file.size > 100 * 1024 * 1024) {
                                  alert('Audio file size exceeds 100MB limit');
                                  if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
                                  return;
                                }
                                setUploadingFileFor(index);
                                try {
                                  if (!selectedCourse || !lesson._id) {
                                    alert('Please save the lesson before uploading audio.');
                                    return;
                                  }
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const token = localStorage.getItem('authToken');
                                  const response = await fetch(
                                    `${API_BASE_URL}/videos/lessons/${selectedCourse.id}/${lesson._id}/media`,
                                    {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${token}` },
                                      body: formData,
                                    }
                                  );
                                  const data = await response.json();
                                  if (!response.ok) throw new Error(data.message || 'Failed to upload audio');
                                  lesson.files = lesson.files || [];
                                  lesson.files.push({
                                    fileName: file.name,
                                    fileUrl: data.file.downloadUrl,
                                    fileType: 'audio',
                                    fileSize: file.size,
                                    mimeType: file.type,
                                    uploadedAt: new Date().toISOString(),
                                  });
                                  setLessons([...lessons]);
                                  alert(`✓ Audio "${file.name}" uploaded successfully!`);
                                } catch (err) {
                                  alert(`Failed to upload audio: ${err instanceof Error ? err.message : 'Please try again.'}`);
                                } finally {
                                  setUploadingFileFor(null);
                                  if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
                                }
                                return;
                              }
                              // Fallback to original upload for other types
                              uploadFileToLesson(index, file);
                              if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
                            }}
                            disabled={uploadingFileFor === index}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => document.getElementById(`lesson-files-${index}`)?.click()}
                            disabled={uploadingFileFor === index || !lesson.title?.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            title={!lesson.title?.trim() ? 'Enter a lesson title first' : ''}
                          >
                            {uploadingFileFor === index ? 'Adding...' : '+ Add'}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, PowerPoint, Images, ZIP, Audio (MP3, M4A, AAC, WAV, OGG, FLAC) • Max 100MB
                        </p>
                      </div>

                      {/* File Preview Cards */}
                      {lesson.files && lesson.files.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lesson.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="group relative bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition cursor-pointer"
                              onClick={() => {
                                setPreviewLessonIndex(index);
                                setPreviewFileIndex(fileIndex);
                                setShowFilePreview(true);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {/* File Icon/Thumbnail */}
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
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
                                  <p className="text-xs font-semibold text-gray-900 truncate break-words hover:text-blue-600">
                                    {file.fileName}
                                  </p>
                                  {file.fileSize && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                  <p className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition">
                                    👁️ Click to preview
                                  </p>
                                </div>
                              </div>

                              {/* Delete Button */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFileFromLesson(index, fileIndex);
                                }}
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

          {/* Video Preview Modal */}
          <Dialog open={showVideoPreview} onOpenChange={setShowVideoPreview}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {previewLessonIndex !== null ? `Preview: ${lessons[previewLessonIndex]?.title}` : 'Video Preview'}
                </DialogTitle>
              </DialogHeader>
              <div className="w-full bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                {previewHlsUrl ? (
                  <HLSVideoPlayer
                    hlsUrl={previewHlsUrl}
                    title={previewLessonIndex !== null ? lessons[previewLessonIndex]?.title : 'Video Preview'}
                    onError={(err) => console.error("Video playback error:", err)}
                    className="w-full h-full"
                  />
                ) : loadingPreviewVideo ? (
                  <div className="text-white flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Loading video...
                  </div>
                ) : (
                  <div className="text-gray-400 text-center">
                    <p className="mb-2">Video preview not available</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVideoPreview(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* File Preview Modal */}
          <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {previewLessonIndex !== null && previewFileIndex !== null
                    ? lessons[previewLessonIndex]?.files?.[previewFileIndex]?.fileName
                    : 'File Preview'}
                </DialogTitle>
              </DialogHeader>
              
              {previewLessonIndex !== null && previewFileIndex !== null && (
                <div className="space-y-4">
                  {(() => {
                    const file = lessons[previewLessonIndex]?.files?.[previewFileIndex];
                    if (!file) return <p>File not found</p>;

                    // Image preview
                    if (file.fileType.includes('image')) {
                      return (
                        <div className="flex justify-center">
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="max-w-full max-h-96 rounded-lg"
                          />
                        </div>
                      );
                    }

                    // PDF preview (embed)
                    if (file.fileType === 'pdf') {
                      return (
                        <div className="w-full h-96 rounded-lg border border-gray-200 overflow-hidden">
                          <iframe
                            src={`${file.fileUrl}#toolbar=0`}
                            className="w-full h-full"
                            title="PDF Preview"
                          />
                        </div>
                      );
                    }

                    // For other file types, show file info and download option
                    return (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="text-5xl">
                          {getFileIcon(file.fileType)}
                        </div>
                        <p className="font-semibold text-gray-900">{file.fileName}</p>
                        <p className="text-sm text-gray-600">
                          {(file.fileSize ? file.fileSize / 1024 / 1024 : 0).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-gray-500 text-center max-w-xs">
                          Preview not available for this file type. Click below to download.
                        </p>
                        <a
                          href={file.fileUrl}
                          download={file.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                        >
                          ⬇️ Download File
                        </a>
                      </div>
                    );
                  })()}

                  {/* File Info */}
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                    <p className="text-xs text-gray-600">
                      <strong>File Name:</strong> {lessons[previewLessonIndex]?.files?.[previewFileIndex]?.fileName}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>File Size:</strong> {((lessons[previewLessonIndex]?.files?.[previewFileIndex]?.fileSize || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Type:</strong> {lessons[previewLessonIndex]?.files?.[previewFileIndex]?.fileType.toUpperCase()}
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFilePreview(false)}>
                  Close
                </Button>
                {previewLessonIndex !== null && previewFileIndex !== null && (
                  <a
                    href={lessons[previewLessonIndex]?.files?.[previewFileIndex]?.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                  >
                    ⬇️ Download
                  </a>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
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
                          {enrollment.amount > 0
                            ? `${selectedCourse?.currency === 'INR' ? '₹' : '$'}${enrollment.amount}`
                            : 'Free'}
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

      {/* Coupons Dialog */}
      <Dialog open={couponsDialogOpen} onOpenChange={setCouponsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coupon Codes — {selectedCourse?.title}</DialogTitle>
            <DialogDescription>
              Create and manage discount coupons for this course.
            </DialogDescription>
          </DialogHeader>

          {/* Create coupon form */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm font-semibold text-gray-700">Create New Coupon</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="coupon-code">Code *</Label>
                <Input
                  id="coupon-code"
                  placeholder="e.g. SAVE20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="coupon-type">Discount Type</Label>
                <Select
                  value={couponForm.discountType}
                  onValueChange={(v) => setCouponForm({ ...couponForm, discountType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="coupon-value">Discount Value *</Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min="1"
                  placeholder={couponForm.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="coupon-max">Max Redemptions</Label>
                <Input
                  id="coupon-max"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={couponForm.maxRedemptions}
                  onChange={(e) => setCouponForm({ ...couponForm, maxRedemptions: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="coupon-expires">Expiry Date (optional)</Label>
                <Input
                  id="coupon-expires"
                  type="date"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                />
              </div>
            </div>
            {couponError && (
              <p className="text-sm text-red-600">{couponError}</p>
            )}
            <Button
              size="sm"
              onClick={handleCreateCoupon}
              disabled={couponSaving || !couponForm.code || !couponForm.discountValue}
            >
              {couponSaving ? 'Creating...' : 'Create Coupon'}
            </Button>
          </div>

          {/* Existing coupons list */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Existing Coupons</p>
            {couponsLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : coupons.length === 0 ? (
              <p className="text-sm text-gray-500">No coupons yet for this course.</p>
            ) : (
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <div key={coupon._id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{coupon.code}</span>
                        <Badge variant={coupon.isActive ? "default" : "secondary"}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `${selectedCourse?.currency === 'INR' ? '₹' : '$'}${coupon.discountValue} off`}
                        {' · '}{coupon.redemptions}/{coupon.maxRedemptions || '∞'} used
                        {coupon.expiresAt && ` · Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon._id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
