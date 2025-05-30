from fastapi import APIRouter, HTTPException
from app.vectorstore.store import get_vectorstore
import datetime
import logging
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/cities")
async def get_cities():
    """
    Returns a list of all unique cities from the vector store
    """
    try:
        # Get the summary vectorstore
        summaries_vectorstore = get_vectorstore(store_type="summary")
        if summaries_vectorstore is None:
            raise HTTPException(status_code=500, detail="Vectorstore not initialized properly")
        
        # Query all documents
        results = summaries_vectorstore._collection.get()
        
        # Extract cities from metadata
        cities = set()
        for i, metadata in enumerate(results.get('metadatas', [])):
            city = metadata.get('Vieta', '') or metadata.get('vieta', '')
            
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
        
        return {"cities": sorted_cities}
        
    except Exception as e:
        logger.error(f"Error fetching cities: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching cities: {str(e)}")

@router.get("/recent-projects")
async def get_recent_projects(city: Optional[str] = None):
    """
    Returns the 20 most recent projects sorted by deadline date
    Optional filter by city
    """
    try:
        # Get the summary vectorstore
        summaries_vectorstore = get_vectorstore(store_type="summary")
        if summaries_vectorstore is None:
            raise HTTPException(status_code=500, detail="Vectorstore not initialized properly")
        
        # Get today's date
        today = datetime.datetime.now().date()
        
        # Query all documents
        results = summaries_vectorstore._collection.get()
        
        valid_projects = []
        for i, doc_content in enumerate(results.get('documents', [])):
            metadata = results.get('metadatas', [])[i] if i < len(results.get('metadatas', [])) else {}
            
            # If city filter is provided, check if document matches
            if city:
                doc_city = metadata.get('Vieta', '') or metadata.get('vieta', '')
                if not doc_city or city.lower() not in doc_city.lower():
                    continue
            
            # Get the date field (handle different naming conventions)
            date_str = metadata.get('Pateikti_projekta_iki') or metadata.get('Pasiulyma_pateikti_iki') or metadata.get('pateikti_iki')
            
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
                logger.error(f"Error parsing date: {e}")
                continue
                
            if date_obj and date_obj >= today:
                valid_projects.append({
                    "id": metadata.get("uuid", ""),
                    "title": metadata.get("Projekto_pavadinimas", "") or metadata.get("pavadinimas", ""),
                    "deadline": date_str,
                    "deadline_timestamp": date_obj.isoformat(),
                    "location": metadata.get("Vieta", "") or metadata.get("vieta", ""),
                    "summary": doc_content[:200] + "..." if len(doc_content) > 200 else doc_content,
                })
        
        # Sort by deadline (closest first)
        valid_projects.sort(key=lambda x: x.get("deadline_timestamp", ""))
        
        # Return just the first 20
        return {"projects": valid_projects[:20]}
        
    except Exception as e:
        logger.error(f"Error fetching recent projects: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching recent projects: {str(e)}")