import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

// Create a CSS module file if it doesn't exist yet
// You may need to adjust this import to match your actual CSS file
import styles from '../styles/RecentProjects.module.css';

interface Project {
  id: string;
  title: string;
  deadline: string;
  location: string;
  summary: string;
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
      console.log(`Fetching projects with filter: ${cityFilter}`);
      
      const url = cityFilter 
        ? `${API_URL}/api/recent-projects?city=${encodeURIComponent(cityFilter)}`
        : `${API_URL}/api/recent-projects`;
      
      const response = await axios.get(url);
      console.log("Projects response:", response.data);
      
      if (response.data && Array.isArray(response.data.projects)) {
        setProjects(response.data.projects);
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
      console.log("Fetching cities...");
      
      const response = await axios.get(`${API_URL}/api/cities`);
      console.log("Cities response:", response.data);
      
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
      
      projects.push({
        id: `test-${i + 1}`,
        title: titles[i % titles.length],
        deadline: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        location,
        summary: `Testinis projektas #${i + 1}: Projekte numatyti energetinio efektyvumo didinimo darbai.`
      });
    }
    
    return projects;
  };

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

  // Handle city filter change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };

  // Create URL for project details page
  const createChatUrl = (project: Project) => {
    return `/chat?query=${encodeURIComponent(`Projektas: ${project.title}`)}&project_id=${project.id}`;
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