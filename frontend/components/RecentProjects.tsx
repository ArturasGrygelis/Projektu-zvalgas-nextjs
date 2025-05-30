import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/RecentProjects.module.css';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

interface Project {
  id: string;
  title: string;
  deadline: string;
  location: string;
  summary: string;
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

  // Fetch list of cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        console.log("Fetching cities...");
        const response = await axios.get<CitiesResponse>('/api/cities');
        console.log("Cities response:", response.data);
        if (response.data && Array.isArray(response.data.cities)) {
          setCities(response.data.cities);
        } else {
          console.error("Invalid cities data format:", response.data);
          setCities([]);
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        // Don't set error - we can still show projects without cities filter
        setCities([]);
      }
    };

    fetchCities();
  }, []);

  // Fetch projects whenever selected city changes
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        setLoading(true);
        console.log(`Fetching projects with city filter: "${selectedCity}"`);
        
        const url = selectedCity 
          ? `/api/recent-projects?city=${encodeURIComponent(selectedCity)}` 
          : '/api/recent-projects';
        
        console.log(`API URL: ${url}`);
        const response = await axios.get<ProjectsResponse>(url);
        console.log("Projects response:", response.data);
        
        if (response.data && Array.isArray(response.data.projects)) {
          setProjects(response.data.projects);
        } else {
          console.error("Invalid projects data format:", response.data);
          setProjects([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch recent projects:', err);
        setError('Nepavyko užkrauti projektų');
        setLoading(false);
        setProjects([]);
      }
    };

    fetchRecentProjects();
  }, [selectedCity]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      // Handle different date formats
      if (!dateStr) return '';
      
      // Try to parse the date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // Return original if parsing fails
      }
      return date.toLocaleDateString('lt-LT');
    } catch {
      return dateStr; // Return original if parsing fails
    }
  };

  // Handle city selection change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    console.log(`City filter changed to: "${newCity}"`);
    setSelectedCity(newCity);
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
            {projects.map((project) => (
              <li key={project.id || Math.random().toString()} className={styles.projectCard}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <div className={styles.projectMeta}>
                  <span className={styles.deadline}>
                    <FaCalendarAlt className={styles.icon} />
                    {formatDate(project.deadline)}
                  </span>
                  {project.location && (
                    <span className={styles.location}>
                      <FaMapMarkerAlt className={styles.icon} />
                      {project.location}
                    </span>
                  )}
                </div>
                <p className={styles.summary}>{project.summary}</p>
                <a href={`/chat?query=Projektas: ${encodeURIComponent(project.title)}`} className={styles.moreLink}>
                  Sužinoti daugiau
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}