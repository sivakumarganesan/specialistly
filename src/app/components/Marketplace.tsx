import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { creatorAPI } from "@/app/api/apiClient";
import { Button } from "@/app/components/ui/button";
import { Search, ChevronRight } from "lucide-react";
import { CategoryFilter } from "@/app/components/CategoryFilter";
import { CATEGORY_COLORS } from "@/app/constants/specialityCategories";

interface Specialist {
  _id: string;
  name: string;
  email: string;
  bio: string;
  specialization: string;
  profilePicture?: string;
  rating: number;
  totalStudents: number;
  servicesCount: number;
  coursesCount: number;
  specialityCategories?: string[];
}

interface MarketplaceProps {
  onViewSpecialist: (specialistId: string, specialistEmail: string) => void;
}

export function Marketplace({ onViewSpecialist }: MarketplaceProps) {
  const { user } = useAuth();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    try {
      setIsLoading(true);
      const response = await creatorAPI.getAllSpecialists();
      const creators = Array.isArray(response?.data) ? response.data : [];
      
      // Filter out current user and map to specialist format
      const activeSpecialists = creators
        .filter((creator: any) => creator.email !== user?.email)
        .map((creator: any) => ({
          _id: creator._id,
          name: creator.name,
          email: creator.email,
          bio: creator.bio || "Expert Specialist",
          specialization: creator.specialization || "Professional Services",
          profilePicture: creator.profilePicture,
          rating: creator.rating || 4.5,
          totalStudents: creator.totalStudents || 0,
          servicesCount: creator.servicesCount || 0,
          coursesCount: creator.coursesCount || 0,
          specialityCategories: creator.specialityCategories || [],
        }));

      setSpecialists(activeSpecialists);
      setFilteredSpecialists(activeSpecialists);
    } catch (error) {
      console.error("Failed to fetch specialists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = specialists.filter((specialist) =>
      (specialist.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (specialist.specialization || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (specialist.bio || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((specialist) =>
        selectedCategories.some((category) =>
          specialist.specialityCategories?.includes(category)
        )
      );
    }

    setFilteredSpecialists(filtered);
  }, [searchTerm, specialists, selectedCategories]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  // Rotating background colors for specialist cards (Podia-style)
  const cardColors = [
    'bg-amber-300',
    'bg-sky-200',
    'bg-purple-300',
    'bg-stone-200',
    'bg-rose-200',
    'bg-teal-200',
    'bg-orange-300',
    'bg-lime-200',
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">Browse Specialists</h1>
        <p className="text-lg text-gray-600">Discover experts and book sessions with top creators.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search specialists by name or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
          />
        </div>
      </div>

      {/* Category Filter */}
      <CategoryFilter 
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
        onClearAll={handleClearAllCategories}
      />

      {/* Specialists Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading specialists...</p>
        </div>
      ) : filteredSpecialists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredSpecialists.map((specialist, index) => (
            <div
              key={specialist._id}
              className="group cursor-pointer"
              onClick={() => onViewSpecialist(specialist._id, specialist.email)}
            >
              {/* Photo Card */}
              <div className={`${cardColors[index % cardColors.length]} rounded-2xl h-72 flex items-end justify-center overflow-hidden mb-5 group-hover:shadow-xl transition-shadow duration-300`}>
                {specialist.profilePicture ? (
                  <img
                    src={specialist.profilePicture}
                    alt={specialist.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <span className="text-8xl font-bold text-white/60 group-hover:scale-110 transition-transform duration-300">
                      {specialist.name ? specialist.name[0].toUpperCase() : "S"}
                    </span>
                  </div>
                )}
              </div>

              {/* Category Badges */}
              {specialist.specialityCategories && specialist.specialityCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {specialist.specialityCategories.slice(0, 2).map(category => (
                    <span
                      key={category}
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                        CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Specialist Info */}
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Specialist</p>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5 flex items-center gap-1 group-hover:gap-2 transition-all">
                {specialist.name}
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {specialist.bio || specialist.specialization}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">
            {selectedCategories.length > 0 ? "No specialists found in selected categories" : "No specialists found matching your search"}
          </p>
          {selectedCategories.length > 0 && (
            <Button onClick={handleClearAllCategories} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
