import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { courseAPI } from "@/app/api/apiClient";
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
  status: "active" | "draft";
  level: string;
  category: string;
  thumbnail?: string;
  // Self-paced specific fields
  modules?: Module[];
  totalLessons?: number;
  certificateIncluded?: boolean;
  accessDuration?: string;
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
            type: course.type,
            description: course.description,
            price: course.price,
            duration: course.duration,
            studentsEnrolled: course.studentsEnrolled || 0,
            status: course.status || "draft",
            level: course.level,
            category: course.category,
            modules: course.modules,
            totalLessons: course.totalLessons,
            certificateIncluded: course.certificateIncluded,
            accessDuration: course.accessDuration,
            cohortSize: course.cohortSize,
            startDate: course.startDate,
            endDate: course.endDate,
            schedule: course.schedule,
            meetingPlatform: course.meetingPlatform,
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
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseType, setCourseType] = useState<"self-paced" | "cohort-based" | null>(null);

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
        type: courseType,
        description: formData.description,
        price: formData.price,
        duration: formData.duration,
        studentsEnrolled: 0,
        status: "draft",
        level: formData.level,
        category: formData.category,
        creator: user?.email,
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
        price: formData.price,
        duration: formData.duration,
        level: formData.level,
        category: formData.category,
        creator: user?.email,
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
      const newStatus = course.status === "active" ? "draft" : "active";
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
        alert(`✓ Course status updated to ${newStatus}!`);
      } catch (error) {
        console.error("Failed to update course status:", error);
        alert(`Failed to update course status: ${error instanceof Error ? error.message : "Please try again."}`);
      }
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      duration: course.duration,
      level: course.level,
      category: course.category,
      totalLessons: course.totalLessons?.toString() || "",
      certificateIncluded: course.certificateIncluded || true,
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
    return courses.filter((c) => c.status === "active").length;
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
                      course.status === "active"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(course.id)}
                  >
                    {course.status === "active" ? "Deactivate" : "Activate"}
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
    </div>
  );
}
