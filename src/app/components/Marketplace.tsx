import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { creatorAPI } from "@/app/api/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Search, MapPin, Star, Users } from "lucide-react";

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
    const filtered = specialists.filter((specialist) =>
      (specialist.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (specialist.specialization || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (specialist.bio || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpecialists(filtered);
  }, [searchTerm, specialists]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
        <p className="text-gray-600">Discover and book sessions with top specialists</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search specialists by name or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Specialists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>Loading specialists...</p>
          </div>
        ) : filteredSpecialists.length > 0 ? (
          filteredSpecialists.map((specialist) => (
            <Card key={specialist._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {specialist.profilePicture ? (
                      <img
                        src={specialist.profilePicture}
                        alt={specialist.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                        {specialist.name ? specialist.name[0] : "S"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{specialist.name}</CardTitle>
                    <CardDescription className="text-sm">{specialist.specialization}</CardDescription>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{specialist.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{specialist.bio}</p>

                <div className="grid grid-cols-3 gap-3 text-center py-3 border-y">
                  <div>
                    <p className="text-lg font-bold text-purple-600">{specialist.coursesCount}</p>
                    <p className="text-xs text-gray-600">Courses</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">{specialist.servicesCount}</p>
                    <p className="text-xs text-gray-600">Services</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-600" />
                      <p className="text-lg font-bold text-purple-600">{specialist.totalStudents}</p>
                    </div>
                    <p className="text-xs text-gray-600">Students</p>
                  </div>
                </div>

                <Button
                  onClick={() => onViewSpecialist(specialist._id, specialist.email)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-4">No specialists found matching your search</p>
            <Button
              onClick={() => setSearchTerm("")}
              variant="outline"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
