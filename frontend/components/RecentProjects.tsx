import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import styles from '../styles/RecentProjects.module.css';
import { FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle, FaRegFileAlt } from 'react-icons/fa';

// Define proper types for projects
interface Project {
  id: string;
  title: string;
  deadline: string;
  location: string;
  summary: string;
  document_id?: string;
  Dokumento_pavadinimas?: string;
  dokumento_pavadinimas?: string;
  Projekto_pavadinimas?: string;
  projekto_pavadinimas?: string;
  Dokumento_tipas?: string;
  dokumento_tipas?: string;
}

// Define the expected API response types
interface CitiesResponse {
  cities: string[];
}

interface ProjectsResponse {
  projects: Project[];
}

export default function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get API base URL from environment variable or use default
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load test projects on component mount
  useEffect(() => {
    // Immediately set some test data to show something
    const testProjects = generateTestProjects("");
    setProjects(testProjects);
    
    // Try to fetch real data from the backend
    fetchProjects();
    fetchCities();
  }, []);

  // Fetch projects when city filter changes
  useEffect(() => {
    if (selectedCity !== "") {
      fetchProjects(selectedCity);
    }
  }, [selectedCity]);

  // Fetch projects from backend
  const fetchProjects = async (cityFilter: string = "") => {
    try {
      setLoading(true);
      
      const url = cityFilter 
        ? `${API_URL}/api/recent-projects?city=${encodeURIComponent(cityFilter)}`
        : `${API_URL}/api/recent-projects`;
      
      const response = await axios.get<ProjectsResponse>(url);
      
      if (response.data && Array.isArray(response.data.projects)) {
        // Ensure consistent naming convention with DocumentSidebar
        const processedProjects = response.data.projects.map(project => {
          // Format projects to match DocumentSidebar naming
          return {
            ...project,
            // Add standardized document title if not present
            Dokumento_pavadinimas: project.Dokumento_pavadinimas || 
              `Kvietimas pateikti pasiūlymą: ${project.location ? `${project.location} - ${project.title}` : project.title}`,
            // Set document type
            Dokumento_tipas: project.Dokumento_tipas || "Kvietimas"
          };
        });
        setProjects(processedProjects);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      // Keep the test data that was set initially
      setLoading(false);
    }
  };

  // Fetch cities from backend
  const fetchCities = async () => {
    try {
      const response = await axios.get<CitiesResponse>(`${API_URL}/api/cities`);
      
      if (response.data && Array.isArray(response.data.cities)) {
        setCities(response.data.cities);
      } else {
        // Fallback to hardcoded cities
        setCities(["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"]);
      }
    } catch (err) {
      console.error("Failed to fetch cities:", err);
      // Fallback to hardcoded cities
      setCities(["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"]);
    }
  };

  // Generate test projects for initial loading or fallback
  const generateTestProjects = (cityFilter: string = ""): Project[] => {
    const allCities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"];
    const titles = [
      "Renovacija - Daugiabučio modernizavimas",
      "Statyba - Administracinio pastato rekonstrukcija",
      "Renovacija - Mokyklos atnaujinimas",
      "Statyba - Sporto komplekso įrengimas",
      "Renovacija - Kultūros centro atnaujinimas"
    ];
    
    const projects = [];
    
    for (let i = 0; i < 5; i++) {
      const location = allCities[i % allCities.length];
      
      // Skip if filtering by city and doesn't match
      if (cityFilter && location !== cityFilter) {
        continue;
      }

      const title = titles[i % titles.length];
      const formattedDocName = `Kvietimas pateikti pasiūlymą: ${location} - ${title}`;
      
      projects.push({
        id: `test-${i + 1}`,
        title: title,
        deadline: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        location,
        summary: `Testinis projektas #${i + 1}: Projekte numatyti energetinio efektyvumo didinimo darbai.`,
        document_id: `doc-${i + 1}`,
        // Add fields that match DocumentSidebar naming
        Dokumento_pavadinimas: formattedDocName,
        Projekto_pavadinimas: title,
        Dokumento_tipas: "Kvietimas"
      });
    }
    
    return projects;
  };

  // Format date for display - same as in DocumentSidebar
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      
      // Return as-is if already formatted in Lithuanian style
      if (dateStr.includes('d.') && dateStr.includes('val.')) {
        return dateStr;
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('lt-LT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Handle city filter change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };

  // Get clean title without prefixes - same as in DocumentSidebar
  const getCleanTitle = (docName: string): string => {
    // Remove common prefixes
    const prefixesToRemove = [
      'Kvietimas pateikti pasiūlymą:', 
      'Kvietimas teikti pasiūlymą:', 
      'Kvietimas:',
      'Dokumentas:'
    ];
    
    let cleanTitle = docName;
    
    for (const prefix of prefixesToRemove) {
      if (cleanTitle.startsWith(prefix)) {
        cleanTitle = cleanTitle.substring(prefix.length).trim();
        break;
      }
    }
    
    return cleanTitle;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Artėjantys projektai</h2>
        {cities.length > 0 && (
          <div className={styles.filterContainer}>
            <select 
              id="cityFilter" 
              value={selectedCity} 
              onChange={handleCityChange}
              className={styles.citySelect}
              aria-label="Filtruoti pagal miestą"
            >
              <option value="">Visi miestai</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.projectsContainer}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : projects.length === 0 ? (
          <p className={styles.noProjects}>
            {selectedCity 
              ? `Nėra projektų mieste ${selectedCity}` 
              : "Nėra artėjančių projektų"}
          </p>
        ) : (
          <ul className={styles.projectList}>
            {projects.map((project) => {
              // Get document name using the same pattern as DocumentSidebar
              const fullDocName = project.Dokumento_pavadinimas || 
                                  project.dokumento_pavadinimas || 
                                  `Kvietimas pateikti pasiūlymą: ${project.location ? `${project.location} - ${project.title}` : project.title}`;
                                  
              // Clean the title for display using same logic as DocumentSidebar
              const cleanTitle = getCleanTitle(fullDocName);
              
              // Format date using the same pattern as DocumentSidebar
              const formattedDate = formatDate(project.deadline);
              const dateString = formattedDate ? `Pasiūlymą pateikti iki: ${formattedDate}` : null;
              
              return (
                <li key={project.id || Math.random().toString()} className={styles.projectCard}>
                  {/* Match DocumentSidebar's document header structure */}
                  <div className={styles.docHeader}>
                    {/* Document type badge and icon - matching DocumentSidebar */}
                    <div className={styles.docTypeWrapper}>
                      <div className={styles.docTypeIcon}>
                        <FaRegFileAlt />
                      </div>
                      <div className={styles.docTypeInfo}>
                        <div className={styles.docType}>
                          {project.Dokumento_tipas || "Kvietimas"}
                        </div>
                        {dateString && (
                          <div className={styles.docDate}>
                            {dateString}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document title - using cleaned title */}
                    <h3 className={styles.projectTitle}>{cleanTitle}</h3>
                    
                    {/* Location - same as DocumentSidebar */}
                    {project.location && (
                      <div className={styles.location}>
                        <FaMapMarkerAlt className={styles.icon} />
                        <span>{project.location}</span>
                      </div>
                    )}
                    
                    {/* Summary - same text treatment as DocumentSidebar */}
                    {project.summary && (
                      <p className={styles.summary}>{project.summary}</p>
                    )}
                    
                    {/* Action button - styled to match DocumentSidebar's button */}
                    <div className={styles.actionLinks}>
                      <Link 
                        href={project.document_id 
                          ? `/chat?documentId=${encodeURIComponent(project.document_id)}` 
                          : `/chat?question=${encodeURIComponent(`Išsami informacija apie: ${project.title}`)}`
                        }
                        className={styles.actionButton}
                      >
                        <span>Klauskite apie šį dokumentą</span>
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}