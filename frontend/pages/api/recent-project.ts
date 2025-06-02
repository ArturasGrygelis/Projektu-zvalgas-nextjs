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
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Test the API connection immediately on component mount
  useEffect(() => {
    const testApi = async () => {
      try {
        console.log("Testing API connection...");
        // Try the health endpoint
        const response = await axios.get('/health');
        setTestResponse(`Success: ${JSON.stringify(response.data)}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setTestResponse(`Error: ${errorMsg}`);
        console.error('API test failed:', err);
      }
    };

    testApi();
  }, []);

  // Fetch projects - use hardcoded test data if API fails
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        setLoading(true);
        console.log(`Fetching projects with city filter: "${selectedCity}"`);
        
        try {
          const url = selectedCity 
            ? `/api/recent-projects?city=${encodeURIComponent(selectedCity)}` 
            : '/api/recent-projects';
          
          console.log(`API URL: ${url}`);
          const response = await axios.get<ProjectsResponse>(url);
          console.log("Projects response:", response.data);
          
          if (response.data && Array.isArray(response.data.projects)) {
            setProjects(response.data.projects);
          } else {
            throw new Error("Invalid projects data format");
          }
        } catch (apiErr) {
          console.error('API request failed, using test data instead:', apiErr);
          // Fallback to hardcoded test data
          const testProjects = generateTestProjects(selectedCity);
          setProjects(testProjects);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to handle projects:', err);
        setError('Nepavyko užkrauti projektų');
        setLoading(false);
      }
    };

    fetchRecentProjects();
  }, [selectedCity]);

  // Generate test data if API fails
  const generateTestProjects = (cityFilter?: string): Project[] => {
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
      
      projects.push({
        id: `test-${i + 1}`,
        title: titles[i % titles.length],
        deadline: new Date(Date.now() + (i + 1) * 86400000).toISOString(), // Future dates
        location,
        summary: `Testinis projektas #${i + 1}: Projekte numatyti energetinio efektyvumo didinimo darbai.`
      });
    }
    
    return projects;
  };

  // City list - use hardcoded if API fails
  useEffect(() => {
    const fetchCities = async () => {
      try {
        console.log("Fetching cities...");
        try {
          const response = await axios.get<CitiesResponse>('/api/cities');
          console.log("Cities response:", response.data);
          if (response.data && Array.isArray(response.data.cities)) {
            setCities(response.data.cities);
          } else {
            throw new Error("Invalid cities data format");
          }
        } catch (apiErr) {
          console.error('API request failed, using hardcoded cities instead:', apiErr);
          setCities(["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"]);
        }
      } catch (err) {
        console.error('Failed to handle cities:', err);
        setCities([]);
      }
    };

    fetchCities();
  }, []);

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('lt-LT');
    } catch {
      return dateStr;
    }
  };

  // Handle city selection change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    console.log(`City filter changed to: "${newCity}"`);
    setSelectedCity(newCity);
  };

  // Create a proper URL for the chat link
  const createChatUrl = (project: Project) => {
    return `/chat?query=${encodeURIComponent(`Projektas: ${project.title}`)}&project_id=${project.id}`;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Artėjantys projektai</h2>
        {testResponse && (
          <div className={styles.debug} style={{fontSize: '10px', opacity: 0.7}}>
            API Test: {testResponse}
          </div>
        )}
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
                <a href={createChatUrl(project)} className={styles.moreLink}>
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