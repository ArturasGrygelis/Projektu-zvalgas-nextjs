from fastapi import APIRouter, HTTPException
from app.vectorstore.store import get_vectorstore
import datetime
import logging
from typing import Optional, List

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/cities")
async def get_cities():
    """
    Returns a list of all unique cities from the vector store
    """
    try:
        logger.info("Cities endpoint called")
        
        # Get the summary vectorstore
        summaries_vectorstore = get_vectorstore(store_type="summary")
        if summaries_vectorstore is None:
            logger.error("Vectorstore not initialized properly")
            raise HTTPException(status_code=500, detail="Vectorstore not initialized properly")
        
        # Query all documents
        results = summaries_vectorstore._collection.get()
        
        # Extract cities from metadata
        cities = set()
        for i, metadata in enumerate(results.get('metadatas', [])):
            # Check all possible field names for city
            city = (metadata.get('Miestas', '') or 
                   metadata.get('miestas', '') or 
                   metadata.get('Vieta', '') or 
                   metadata.get('vieta', ''))
            
            # Clean and process the city name
            if city:
                # Extract just the city name if it has district or other info
                if "," in city:
                    city = city.split(",")[0].strip()
                
                # Skip empty or very short strings
                if len(city) > 2:
                    cities.add(city)
        
        # Sort cities alphabetically
        sorted_cities = sorted(list(cities))
        logger.info(f"Returning {len(sorted_cities)} cities: {sorted_cities}")
        
        return {"cities": sorted_cities}
        
    except Exception as e:
        logger.error(f"Error fetching cities: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching cities: {str(e)}")

@router.get("/recent-projects")
async def get_recent_projects(city: Optional[str] = None):
    """
    Returns the 20 most recent projects sorted by deadline date
    Optional filter by city (comma-separated list for multiple cities)
    """
    try:
        logger.info(f"Recent projects endpoint called with city filter: '{city}'")
        
        # Parse multiple cities if provided
        city_filters = []
        if city:
            city_filters = [c.strip().lower() for c in city.split(',') if c.strip()]
            logger.info(f"Filtering by cities: {city_filters}")
        
        # Get the summary vectorstore
        summaries_vectorstore = get_vectorstore(store_type="summary")
        if summaries_vectorstore is None:
            logger.error("Vectorstore not initialized properly")
            raise HTTPException(status_code=500, detail="Vectorstore not initialized properly")
        
        # Get today's date
        today = datetime.datetime.now().date()
        
        # Query all documents
        results = summaries_vectorstore._collection.get()
        
        # Log total documents found
        total_docs = len(results.get('documents', []))
        logger.info(f"Total documents in vectorstore: {total_docs}")
        
        valid_projects = []
        filtered_out = 0
        date_errors = 0
        
        for i, doc_content in enumerate(results.get('documents', [])):
            metadata = results.get('metadatas', [])[i] if i < len(results.get('metadatas', [])) else {}
            
            # If city filter is provided, check if document matches
            if city_filters:
                # Check all possible field names for city
                doc_city = (metadata.get('Miestas', '') or 
                           metadata.get('miestas', '') or 
                           metadata.get('Vieta', '') or 
                           metadata.get('vieta', ''))
                
                # Clean up the doc_city for comparison (if it contains commas)
                if doc_city and "," in doc_city:
                    doc_city = doc_city.split(",")[0].strip()
                
                # Convert to lowercase for case-insensitive comparison
                doc_city_lower = doc_city.lower() if doc_city else ""
                
                # Check if any of the filtered cities match
                city_match = False
                for filter_city in city_filters:
                    if filter_city in doc_city_lower:
                        city_match = True
                        logger.debug(f"City match found: '{filter_city}' in '{doc_city}'")
                        break
                
                if not doc_city or not city_match:
                    filtered_out += 1
                    continue
            
            # Get the date field (handle different naming conventions)
            date_str = (metadata.get('Pateikti_projekta_iki') or 
                       metadata.get('Pasiulyma_pateikti_iki') or 
                       metadata.get('pateikti_iki'))
            
            if not date_str:
                continue
                
            # Parse the date
            date_obj = None
            try:
                if isinstance(date_str, str):
                    if "," in date_str:
                        date_part = date_str.split(",")[0].strip()
                    else:
                        date_part = date_str.split(" ")[0].strip()
                    
                    for fmt in ('%Y-%m-%d', '%d.%m.%Y', '%Y/%m/%d', '%d-%m-%Y'):
                        try:
                            date_obj = datetime.datetime.strptime(date_part, fmt).date()
                            break
                        except ValueError:
                            continue
                elif isinstance(date_str, (datetime.date, datetime.datetime)):
                    date_obj = date_str if isinstance(date_str, datetime.date) else date_str.date()
            except Exception as e:
                logger.error(f"Error parsing date '{date_str}': {e}")
                date_errors += 1
                continue
                
            if date_obj and date_obj >= today:
                project_title = metadata.get("Projekto_pavadinimas", "") or metadata.get("pavadinimas", "")
                # Get location from any of the possible fields
                project_location = (metadata.get("Miestas", "") or 
                                   metadata.get("miestas", "") or
                                   metadata.get("Vieta", "") or 
                                   metadata.get("vieta", ""))
                
                valid_projects.append({
                    "id": metadata.get("uuid", "") or f"project-{i}",  # Fallback ID if uuid is missing
                    "title": project_title,
                    "deadline": date_str,
                    "deadline_timestamp": date_obj.isoformat(),
                    "location": project_location,
                    "summary": doc_content[:200] + "..." if len(doc_content) > 200 else doc_content,
                })
        
        # Sort by deadline (closest first)
        valid_projects.sort(key=lambda x: x.get("deadline_timestamp", ""))
        
        # Log statistics
        logger.info(
            f"Projects stats: Total={total_docs}, "
            f"Valid={len(valid_projects)}, "
            f"Filtered out by city={filtered_out}, "
            f"Date errors={date_errors}, "
            f"Returning={len(valid_projects[:20])}"
        )
        
        # Return just the first 20
        return {"projects": valid_projects[:20]}
        
    except Exception as e:
        logger.error(f"Error fetching recent projects: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching recent projects: {str(e)}")