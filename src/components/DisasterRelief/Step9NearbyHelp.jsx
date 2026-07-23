import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  MapPin,
  Phone,
  Navigation,
  Heart,
  ShieldAlert,
  Zap,
  Landmark,
  HeartHandshake,
  AlertCircle,
  Loader2,
  Compass,
  CheckCircle2,
  RefreshCw,
  Star,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LIBRARIES = ["places"];

// Disaster-Specific Nearby Services mapping
const DISASTER_CATEGORIES = {
  "Fire": ["Fire Station", "Hospital", "Police Station", "Pharmacy", "Nearby Shelter"],
  "Flood": ["Hospital", "Police Station", "Community Kitchen", "Nearby Shelter", "Rescue Center"],
  "Cyclone": ["Hospital", "Police Station", "Nearby Shelter", "Community Kitchen", "Pharmacy"],
  "Earthquake": ["Hospital", "Fire Station", "Police Station", "Pharmacy", "Nearby Shelter"],
  "Landslide": ["Hospital", "Police Station", "Nearby Shelter", "Public Works Office", "Pharmacy"],
  "Heavy Rain": ["Hospital", "Police Station", "Pharmacy", "Nearby Shelter", "Electricity Support"],
};

// Search keywords mapped to real Google Places queries (Ordered for smart fallback)
const CATEGORY_SEARCH_QUERIES = {
  "Hospital": ["hospital", "medical center"],
  "Fire Station": ["fire station"],
  "Police Station": ["police station"],
  "Pharmacy": ["pharmacy", "chemist", "medical store"],
  "Nearby Shelter": [
    "public shelter",
    "community hall",
    "government school",
    "town hall",
    "marriage palace",
    "indoor stadium",
    "government building"
  ],
  "Community Kitchen": [
    "langar",
    "gurudwara",
    "ISKCON",
    "community kitchen",
    "food bank",
    "NGO",
    "restaurant"
  ],
  "Rescue Center": [
    "rescue center",
    "civil defence",
    "disaster management office",
    "NDRF",
    "SDRF"
  ],
  "Public Works Office": [
    "PWD office",
    "public works department",
    "government office"
  ],
  "Electricity Support": [
    "electricity office",
    "electricity board",
    "power distribution office",
    "electricity complaint office"
  ]
};

// Icon mapping per emergency category
const iconMap = {
  "Hospital": Heart,
  "Fire Station": Zap,
  "Police Station": ShieldAlert,
  "Pharmacy": HeartHandshake,
  "Nearby Shelter": Landmark,
  "Community Kitchen": HeartHandshake,
  "Rescue Center": Compass,
  "Public Works Office": Landmark,
  "Electricity Support": Zap,
  "Emergency Service": Compass,
};

// Category Colors for Card & Badge styling
const categoryColors = {
  "Hospital": { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", text: "#EF4444" },
  "Fire Station": { bg: "rgba(249, 115, 22, 0.12)", border: "rgba(249, 115, 22, 0.3)", text: "#F97316" },
  "Police Station": { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", text: "#3B82F6" },
  "Pharmacy": { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", text: "#10B981" },
  "Nearby Shelter": { bg: "rgba(244, 201, 93, 0.12)", border: "rgba(244, 201, 93, 0.3)", text: "#F4C95D" },
  "Community Kitchen": { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.3)", text: "#22C55E" },
  "Rescue Center": { bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.3)", text: "#EC4899" },
  "Public Works Office": { bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.3)", text: "#6366F1" },
  "Electricity Support": { bg: "rgba(234, 179, 8, 0.12)", border: "rgba(234, 179, 8, 0.3)", text: "#EAB308" },
  "Emergency Service": { bg: "rgba(165, 168, 181, 0.12)", border: "rgba(165, 168, 181, 0.3)", text: "#A5A8B5" },
};

// Generate high-resolution, category-specific SVG marker pins
function createCategoryMarkerSvg(category, isSelected) {
  const colorMap = {
    "Hospital": "#EF4444",
    "Fire Station": "#F97316",
    "Police Station": "#3B82F6",
    "Pharmacy": "#10B981",
    "Nearby Shelter": "#F4C95D",
    "Community Kitchen": "#22C55E",
    "Rescue Center": "#EC4899",
    "Public Works Office": "#6366F1",
    "Electricity Support": "#EAB308",
    "Emergency Service": "#A855F7",
  };

  const baseColor = colorMap[category] || colorMap["Emergency Service"];
  const pinFill = isSelected ? "#F4C95D" : baseColor;
  const badgeFill = isSelected ? baseColor : "#0B0B12";
  const strokeColor = isSelected ? "#FFFFFF" : "rgba(255,255,255,0.9)";
  const iconColor = "#FFFFFF";

  let iconSvg = "";
  if (category === "Hospital") {
    iconSvg = `<path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7z" fill="${iconColor}"/>`;
  } else if (category === "Fire Station") {
    iconSvg = `<path d="M12 4.5s-4 4.5-4 8.5a4 4 0 0 0 8 0c0-4-4-8.5-4-8.5zm0 10.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="${iconColor}"/>`;
  } else if (category === "Police Station") {
    iconSvg = `<path d="M12 4L5 7v5c0 4.55 3.03 8.81 7 9.93 3.97-1.12 7-5.38 7-9.93V7l-7-3zm0 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z" fill="${iconColor}"/>`;
  } else if (category === "Pharmacy") {
    iconSvg = `<path d="M12 4v16m-8-8h16" stroke="${iconColor}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (category === "Nearby Shelter") {
    iconSvg = `<path d="M12 4.5L4 18.5h16L12 4.5zm0 5l3.5 6.5h-7L12 9.5z" fill="${iconColor}"/>`;
  } else if (category === "Community Kitchen") {
    iconSvg = `<path d="M12 6.5c-2-2.5-5.5-2.5-7.5 0s-2 5.5 0 8l7.5 7.5 7.5-7.5c2-2.5 2-5.5 0-8s-5.5-2.5-7.5 0z" fill="${iconColor}"/>`;
  } else if (category === "Rescue Center") {
    iconSvg = `<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="${iconColor}"/>`;
  } else if (category === "Electricity Support") {
    iconSvg = `<path d="M13 2L4 14h7v8l9-12h-7V2z" fill="${iconColor}"/>`;
  } else {
    iconSvg = `<path d="M12 4a8 8 0 1 0 8 8 8.01 8.01 0 0 0-8-8zm2 10l-6 2 2-6 6-2-2 6z" fill="${iconColor}"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <path d="M17 2C9.268 2 3 8.268 3 16c0 10.5 14 24 14 24s14-13.5 14-24c0-7.732-6.268-14-14-14z" fill="${pinFill}" stroke="${strokeColor}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
      <circle cx="17" cy="16" r="9.5" fill="${badgeFill}"/>
      <g transform="translate(5, 4)">
        ${iconSvg}
      </g>
    </g>
  </svg>`;

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// Generate live user GPS marker SVG pin
function createUserLocationMarkerSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
    <defs>
      <filter id="user-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#3B82F6" flood-opacity="0.5"/>
      </filter>
    </defs>
    <g filter="url(#user-shadow)">
      <circle cx="19" cy="19" r="17" fill="rgba(59, 130, 246, 0.25)" stroke="#3B82F6" stroke-width="1.5"/>
      <circle cx="19" cy="19" r="9" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="19" cy="19" r="3" fill="#FFFFFF"/>
    </g>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0 0 24px 24px",
};

// Clean, sleek, modern dark Google Maps style preset
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0F1117" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0F1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#E5E7EB" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#141E19" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1E2230" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#161924" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9CA3AF" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#292F42" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0A0D14" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4B5563" }],
  },
];

// Helper function to extract numerical lat/lng from any place object structure
function getCoords(obj) {
  if (!obj) return null;
  let lat = obj.lat;
  let lng = obj.lng;

  if (typeof lat === "function") lat = lat();
  if (typeof lng === "function") lng = lng();

  if ((lat === undefined || lat === null) && obj.geometry?.location) {
    const loc = obj.geometry.location;
    lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
    lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
  }

  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return { lat: numLat, lng: numLng };
    }
  }
  return null;
}

// Haversine formula to compute actual distance in km between two lat/lng points
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance string cleanly
function formatDistanceText(distKm) {
  if (distKm === null || distKm === undefined || isNaN(distKm)) return "";
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

// Helper to filter out commercial non-disaster food businesses (flour mills, rice mills, factories, etc.)
function isUnwantedFoodBusiness(name) {
  const n = (name || "").toLowerCase();
  return (
    n.includes("flour mill") ||
    n.includes("atta chakki") ||
    n.includes("rice mill") ||
    n.includes("food factory") ||
    n.includes("grocery wholesaler") ||
    n.includes("wholesale") ||
    n.includes("mill") ||
    n.includes("traders") ||
    n.includes("grain market") ||
    n.includes("warehouse")
  );
}

// Mock places covering all disaster categories for fallback scenarios
const mockPlaces = [
  {
    place_id: "m1",
    name: "Civil Hospital & Emergency Care",
    vicinity: "Sector 16 Emergency Block",
    rating: 4.7,
    category: "Hospital",
    business_status: "OPERATIONAL",
    lat: 30.7415,
    lng: 76.7680,
    isOpen: true,
    phone: "108",
  },
  {
    place_id: "m2",
    name: "City Central Fire Station",
    vicinity: "Industrial Area Phase 1",
    rating: 4.6,
    category: "Fire Station",
    business_status: "OPERATIONAL",
    lat: 30.7065,
    lng: 76.7901,
    isOpen: true,
    phone: "101",
  },
  {
    place_id: "m3",
    name: "District Police Control Room",
    vicinity: "Sector 9 Police Lines",
    rating: 4.5,
    category: "Police Station",
    business_status: "OPERATIONAL",
    lat: 30.7480,
    lng: 76.7935,
    isOpen: true,
    phone: "112",
  },
  {
    place_id: "m4",
    name: "Government Senior Secondary School (Public Shelter)",
    vicinity: "Sector 22 Community Zone",
    rating: 4.6,
    category: "Nearby Shelter",
    business_status: "OPERATIONAL",
    lat: 30.7246,
    lng: 76.7729,
    isOpen: true,
    phone: "1070",
  },
  {
    place_id: "m5",
    name: "Gurudwara Sahib Community Relief Kitchen & Langar",
    vicinity: "Sector 34",
    rating: 4.9,
    category: "Community Kitchen",
    business_status: "OPERATIONAL",
    lat: 30.7225,
    lng: 76.7673,
    isOpen: true,
    phone: "1800-500-222",
  },
  {
    place_id: "m6",
    name: "Apollo Emergency Pharmacy 24x7",
    vicinity: "Sector 17 Plaza",
    rating: 4.4,
    category: "Pharmacy",
    business_status: "OPERATIONAL",
    lat: 30.7398,
    lng: 76.7820,
    isOpen: true,
    phone: "+91 172 500 1234",
  },
  {
    place_id: "m7",
    name: "SDRF Disaster Rescue Command Base",
    vicinity: "Sector 31",
    rating: 4.8,
    category: "Rescue Center",
    business_status: "OPERATIONAL",
    lat: 30.7112,
    lng: 76.7845,
    isOpen: true,
    phone: "1070",
  },
  {
    place_id: "m8",
    name: "Public Works Department (PWD) Division Office",
    vicinity: "Sector 18",
    rating: 4.2,
    category: "Public Works Office",
    business_status: "OPERATIONAL",
    lat: 30.7350,
    lng: 76.7880,
    isOpen: true,
  },
  {
    place_id: "m9",
    name: "State Electricity Board Power Substation",
    vicinity: "Sector 28",
    rating: 4.1,
    category: "Electricity Support",
    business_status: "OPERATIONAL",
    lat: 30.7280,
    lng: 76.8010,
    isOpen: true,
    phone: "1912",
  },
];

// Map Google Places results strictly to disaster emergency category names
function getCategoryForPlace(place, activeCategories) {
  const name = (place.name || "").toLowerCase();
  const types = place.types || [];

  // Strict priority mapping rules (prevent Hospital misclassification)
  if (name.includes("hospital") || name.includes("medical center") || types.includes("hospital")) {
    return "Hospital";
  }

  if (name.includes("fire station") || name.includes("fire brigade") || types.includes("fire_station")) {
    return "Fire Station";
  }

  if (name.includes("police station") || name.includes("police post") || types.includes("police")) {
    return "Police Station";
  }

  if (name.includes("pharmacy") || name.includes("chemist") || name.includes("medical store") || types.includes("pharmacy")) {
    return "Pharmacy";
  }

  if (
    name.includes("gurudwara") ||
    name.includes("iskcon") ||
    name.includes("langar") ||
    name.includes("community kitchen") ||
    name.includes("food bank") ||
    name.includes("ngo")
  ) {
    return "Community Kitchen";
  }

  if (
    name.includes("public shelter") ||
    name.includes("community hall") ||
    name.includes("government school") ||
    name.includes("govt school") ||
    name.includes("town hall") ||
    name.includes("marriage palace") ||
    name.includes("indoor stadium") ||
    name.includes("government building") ||
    name.includes("panchayat") ||
    name.includes("shelter")
  ) {
    return "Nearby Shelter";
  }

  if (
    name.includes("rescue center") ||
    name.includes("rescue base") ||
    name.includes("civil defence") ||
    name.includes("disaster management") ||
    name.includes("ndrf") ||
    name.includes("sdrf")
  ) {
    return "Rescue Center";
  }

  if (name.includes("pwd") || name.includes("public works") || name.includes("government office")) {
    return "Public Works Office";
  }

  if (name.includes("electricity") || name.includes("power distribution") || name.includes("power board")) {
    return "Electricity Support";
  }

  for (const cat of activeCategories) {
    const queries = CATEGORY_SEARCH_QUERIES[cat] || [];
    for (const q of queries) {
      if (name.includes(q.toLowerCase())) {
        return cat;
      }
    }
  }

  return activeCategories[0] || "Emergency Service";
}

export default function Step9NearbyHelp({ services = [], selectedDisaster = "Flood" }) {
  // Determine active disaster type and allowed categories
  const activeDisasterKey = Object.keys(DISASTER_CATEGORIES).find(
    (k) => selectedDisaster && String(selectedDisaster).toLowerCase().includes(k.toLowerCase())
  ) || "Flood";

  const activeCategories = DISASTER_CATEGORIES[activeDisasterKey] || DISASTER_CATEGORIES["Flood"];

  // Component state
  const [userLocation, setUserLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [map, setMap] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const cardRefs = useRef({});
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Auto-detect browser live GPS location on mount
  useEffect(() => {
    detectUserLocation();
  }, []);

  // Populate initial places from props or fallback mock data when no GPS search is running
  useEffect(() => {
    if (!userLocation && !isSearchingPlaces) {
      processFallbackServices(null);
    }
  }, [services, selectedDisaster]);

  // Request user's real browser location
  const detectUserLocation = (onSuccessCallback) => {
    if (!navigator.geolocation) {
      setLocationError(
        "Location services are unavailable. Please enable location services and try again."
      );
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setIsDetectingLocation(false);

        if (map) {
          map.panTo(coords);
          map.setZoom(15);
        }

        // Search for emergency services around the detected user location
        searchNearbyServices(coords, mapRef.current || map);

        if (typeof onSuccessCallback === "function") {
          onSuccessCallback(coords);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Allow location access to find emergency help near you and view locations on Google Maps."
          );
        } else {
          setLocationError(
            "Location services are unavailable. Please enable location services and try again."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Search real Google Places around coordinates using ordered keyword fallback per category
  const searchNearbyServices = async (coords, mapInstance) => {
    if (!coords || !mapInstance || !window.google || !window.google.maps) {
      return;
    }

    setIsSearchingPlaces(true);

    try {
      const placesService = new window.google.maps.places.PlacesService(mapInstance);
      const userLatLng = new window.google.maps.LatLng(coords.lat, coords.lng);

      const foundPlaces = [];
      const seenPlaceIds = new Set();

      // Search each active disaster category sequentially using ordered keywords
      for (const cat of activeCategories) {
        const keywords = CATEGORY_SEARCH_QUERIES[cat] || [cat];
        let categoryFound = false;

        for (const kw of keywords) {
          if (categoryFound) break;

          // Small delay between API calls to avoid hitting Google Places OVER_QUERY_LIMIT
          await new Promise((r) => setTimeout(r, 200));

          let attempts = 0;
          const maxAttempts = 2;

          while (attempts < maxAttempts && !categoryFound) {
            attempts++;
            try {
              const results = await new Promise((resolve) => {
                placesService.textSearch(
                  {
                    location: userLatLng,
                    radius: 10000, // 10 km
                    query: kw,
                  },
                  (res, status) => {
                    if (
                      status === window.google.maps.places.PlacesServiceStatus.OK &&
                      res &&
                      res.length > 0
                    ) {
                      resolve({ results: res, status });
                    } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                      resolve({ results: [], status: "OVER_QUERY_LIMIT" });
                    } else {
                      resolve({ results: [], status });
                    }
                  }
                );
              });

              // Retry after a longer delay on rate limit
              if (results.status === "OVER_QUERY_LIMIT") {
                await new Promise((r) => setTimeout(r, 1000));
                continue;
              }

              // Filter out unwanted commercial businesses & already-found places
              const valid = results.results.filter((p) => {
                if (!p || !p.name) return false;
                if (seenPlaceIds.has(p.place_id)) return false;
                if (isUnwantedFoodBusiness(p.name)) return false;

                // Strict category guard — prevent Hospital/Police/Fire mislabelling
                const assignedCat = getCategoryForPlace(p, activeCategories);
                if (cat === "Hospital" && assignedCat !== "Hospital") return false;
                if (cat === "Police Station" && assignedCat !== "Police Station") return false;
                if (cat === "Fire Station" && assignedCat !== "Fire Station") return false;
                return true;
              });

              if (valid.length > 0) {
                const bestPlace = valid[0];
                seenPlaceIds.add(bestPlace.place_id);

                const c = getCoords(bestPlace);
                const placeLat = c ? c.lat : coords.lat;
                const placeLng = c ? c.lng : coords.lng;
                const distKm = calculateDistance(coords.lat, coords.lng, placeLat, placeLng);
                const estMinutes = distKm ? Math.max(1, Math.round((distKm / 35) * 60)) : null;

                const newEntry = {
                  place_id: bestPlace.place_id || `place_${cat}_${foundPlaces.length}`,
                  name: bestPlace.name,
                  vicinity: bestPlace.formatted_address || bestPlace.vicinity || "Nearby Location",
                  rating: typeof bestPlace.rating === "number" ? bestPlace.rating : null,
                  user_ratings_total: bestPlace.user_ratings_total || null,
                  business_status: bestPlace.business_status || "OPERATIONAL",
                  category: cat, // Always exact disaster category label — never mismatched
                  lat: placeLat,
                  lng: placeLng,
                  distanceKm: distKm,
                  distanceText: formatDistanceText(distKm),
                  etaText: estMinutes ? `${estMinutes} min drive` : null,
                  isOpen:
                    bestPlace.opening_hours?.open_now ??
                    (bestPlace.business_status === "OPERATIONAL" ? true : null),
                  phone: bestPlace.formatted_phone_number || null,
                };

                foundPlaces.push(newEntry);
                categoryFound = true;

                // Progressive UI update: show each card as it arrives
                setNearbyPlaces([...foundPlaces]);
                if (foundPlaces.length === 1) {
                  setSelected(newEntry);
                }
              }
            } catch (e) {
              console.warn(`Places search failed for query "${kw}" (attempt ${attempts}):`, e);
            }
          }
        }

        // Smart fallback: no Google result found for this category → use matching mock entry
        if (!categoryFound) {
          const fallbackMatch = mockPlaces.find(
            (m) => m.category === cat && !seenPlaceIds.has(m.place_id)
          );
          if (fallbackMatch) {
            seenPlaceIds.add(fallbackMatch.place_id);
            const c = getCoords(fallbackMatch);
            const distKm =
              coords && c ? calculateDistance(coords.lat, coords.lng, c.lat, c.lng) : null;
            const estMinutes = distKm ? Math.max(1, Math.round((distKm / 35) * 60)) : null;

            const fallbackEntry = {
              ...fallbackMatch,
              category: cat,
              distanceKm: distKm,
              distanceText: formatDistanceText(distKm),
              etaText: estMinutes ? `${estMinutes} min drive` : null,
            };
            foundPlaces.push(fallbackEntry);
            setNearbyPlaces([...foundPlaces]);
            if (foundPlaces.length === 1) {
              setSelected(fallbackEntry);
            }
          }
        }
      }

      setIsSearchingPlaces(false);

      if (foundPlaces.length > 0) {
        const sorted = [...foundPlaces].sort(
          (a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999)
        );
        setNearbyPlaces(sorted);
        setSelected((prev) => {
          const stillExists = sorted.find(
            (p) => p.place_id === prev?.place_id
          );
          return stillExists || sorted[0] || null;
        });
      } else {
        processFallbackServices(coords);
      }
    } catch (err) {
      console.error("Error performing places search:", err);
      setIsSearchingPlaces(false);
      processFallbackServices(coords);
    }
  };


  // Recalculate distances for services passed via props or fallback mock data
  const processFallbackServices = (coords) => {
    const listToProcess = (services && services.length > 0) ? services : mockPlaces;

    const filtered = listToProcess.filter((srv) => {
      const cat = srv.category || getCategoryForPlace(srv, activeCategories);
      return activeCategories.includes(cat) || activeCategories.some(ac => cat.toLowerCase().includes(ac.toLowerCase()));
    });

    const displayList = filtered.length > 0 ? filtered : listToProcess;

    const updated = displayList.map((srv, idx) => {
      const c = getCoords(srv);
      const lat = c?.lat;
      const lng = c?.lng;
      
      const distKm = coords && lat && lng ? calculateDistance(coords.lat, coords.lng, lat, lng) : null;
      const estMinutes = distKm ? Math.max(1, Math.round((distKm / 35) * 60)) : null;

      return {
        place_id: srv.place_id || srv.id || `srv_${idx}`,
        name: srv.name || "Emergency Facility",
        vicinity: srv.vicinity || srv.address || "Local Area",
        rating: srv.rating || null,
        category: srv.category || getCategoryForPlace(srv, activeCategories),
        lat: lat,
        lng: lng,
        distanceKm: distKm,
        distanceText: formatDistanceText(distKm),
        etaText: estMinutes ? `${estMinutes} min drive` : null,
        isOpen: srv.isOpen ?? true,
        phone: srv.phone || null,
        capacity: srv.capacity || null,
        foodAvailable: srv.foodAvailable || null,
        emergencyBeds: srv.emergencyBeds || null,
      };
    });

    if (coords) {
      // Sort by nearest distance ascending
      updated.sort((a, b) => (a.distanceKm || 99999) - (b.distanceKm || 99999));
    }

    setNearbyPlaces(updated);

    setSelected((prev) => {
      if (prev) {
        const matched = updated.find(
          (p) => p.place_id === prev.place_id || p.name === prev.name
        );
        if (matched) return matched;
      }
      return updated[0] || null;
    });
  };

  // REQUIREMENT: Get Directions opens Google Maps with nearby search centered on current GPS location/coordinates
  const openInGoogleMaps = (placeTarget) => {
    const target = placeTarget || selected;
    if (!target) return;

    const category = target.category || "Emergency Service";
    const coords = getCoords(target);

    // Map categories to service keywords for nearby search
    const searchQueries = {
      "Hospital": "hospitals",
      "Police Station": "police stations",
      "Fire Station": "fire stations",
      "Pharmacy": "pharmacies",
      "Nearby Shelter": "public shelters community halls government schools town halls marriage palaces indoor stadiums government buildings",
      "Community Kitchen": "community kitchens gurudwaras langars ISKCON NGOs food banks restaurants",
      "Rescue Center": "rescue centers civil defence disaster management offices NDRF SDRF",
      "Public Works Office": "PWD offices public works departments government offices",
      "Electricity Support": "electricity offices electricity boards power distribution offices electricity complaint offices"
    };

    const serviceKeyword = searchQueries[category] || category;

    // Use current GPS coordinates (userLocation) if available, otherwise fall back to target place coordinates
    const lat = userLocation?.lat || coords?.lat;
    const lng = userLocation?.lng || coords?.lng;

    let mapsUrl = "";
    if (lat && lng) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceKeyword)}&query_place_id=&center=${lat},${lng}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceKeyword)}`;
    }

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };


  // Synchronize Service List with Google Map & Markers
  const handleSelectPlace = (place) => {
    setSelected(place);
    const coords = getCoords(place);

    if (map && coords) {
      map.panTo(coords);
      map.setZoom(16);
    }

    if (cardRefs.current[place.place_id]) {
      cardRefs.current[place.place_id].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  // Filtered places based on category tab
  const filteredPlaces = nearbyPlaces.filter((place) => {
    if (activeCategory === "All") return true;
    return place.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins flex items-center gap-2">
            Nearby Emergency Help — {activeDisasterKey} Zone
            {userLocation && (
              <span className="text-[10px] font-bold text-[#22C55E] px-2 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Live GPS Active
              </span>
            )}
          </h3>
          <p className="text-xs text-[#A5A8B5] font-inter">
            Disaster-aware emergency services tailored for <span className="text-[#F4C95D] font-semibold">{activeDisasterKey}</span> relative to your browser location
          </p>
        </div>

        {/* Action Button: Refresh Location */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => detectUserLocation()}
            disabled={isDetectingLocation}
            className={`px-4 py-2 rounded-[14px] text-xs font-bold font-inter transition-all flex items-center gap-2 cursor-pointer ${
              userLocation
                ? "bg-[#171923] hover:bg-[#202330] text-[#F4C95D] border border-[rgba(244,201,93,0.3)] shadow-[0_0_15px_rgba(244,201,93,0.05)]"
                : "bg-gradient-to-r from-[#F4C95D] to-[#E5B84C] text-[#0B0B12] hover:opacity-95 shadow-[0_0_20px_rgba(244,201,93,0.2)]"
            }`}
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Detecting location...
              </>
            ) : userLocation ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Location
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5" />
                Find Nearby Help
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading & Permission Status Alerts */}
      <AnimatePresence>
        {isDetectingLocation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-[16px] bg-[#11131A] border border-[#F4C95D]/30 flex items-center gap-3 text-xs text-[#F4C95D]"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="font-medium font-inter">
              Detecting your current location using browser GPS...
            </span>
          </motion.div>
        )}

        {isSearchingPlaces && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-[16px] bg-[#11131A] border border-[#3B82F6]/30 flex items-center gap-3 text-xs text-[#3B82F6]"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="font-medium font-inter">
              Searching for real {activeDisasterKey} emergency help near your coordinates...
            </span>
          </motion.div>
        )}

        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-[16px] bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-between gap-3 text-xs text-[#EF4444]"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium font-inter">{locationError}</span>
            </div>
            <button
              onClick={() => detectUserLocation()}
              className="px-3 py-1.5 rounded-[10px] bg-[#EF4444] text-white font-bold text-[11px] hover:bg-[#DC2626] transition-all shrink-0 cursor-pointer"
            >
              Grant Access
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter Chips (Dynamic per disaster) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {["All", ...activeCategories].map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#F4C95D] text-[#0B0B12] shadow-[0_0_12px_rgba(244,201,93,0.25)]"
                  : "bg-[#11131A] text-[#A5A8B5] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] hover:text-white"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Service Cards (5 cols) | Right Map (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Service List */}
        <div className="lg:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)]">
          {filteredPlaces.length === 0 ? (
            <div className="p-8 text-center bg-[#11131A] rounded-[20px] border border-[rgba(255,255,255,0.06)] space-y-3">
              <Compass className="w-8 h-8 text-[#A5A8B5] mx-auto opacity-50" />
              <p className="text-xs text-[#A5A8B5] font-inter">
                {!userLocation
                  ? "Click 'Find Nearby Help' above to detect your browser location and search nearby emergency services."
                  : "No emergency services found for this category near your location."}
              </p>
              {!userLocation && (
                <button
                  onClick={() => detectUserLocation()}
                  className="px-4 py-2 rounded-[12px] bg-[#F4C95D] text-[#0B0B12] text-xs font-bold hover:bg-[#E5B84C] transition-all cursor-pointer"
                >
                  Find Nearby Help
                </button>
              )}
            </div>
          ) : (
            filteredPlaces.map((place) => {
              const category = place.category || "Emergency Service";
              const Icon = iconMap[category] || Compass;
              const colorTheme = categoryColors[category] || categoryColors["Emergency Service"];
              const isSelected = selected?.place_id === place.place_id;

              return (
                <motion.div
                  key={place.place_id}
                  ref={(el) => (cardRefs.current[place.place_id] = el)}
                  onClick={() => handleSelectPlace(place)}
                  whileHover={{ x: 2 }}
                  className={`p-4 rounded-[20px] border cursor-pointer transition-all duration-300 flex items-center gap-4 relative overflow-hidden ${
                    isSelected
                      ? "border-[rgba(244,201,93,0.3)] bg-[#11131A] shadow-[0_0_20px_rgba(244,201,93,0.06)]"
                      : "border-[rgba(255,255,255,0.06)] bg-[#11131A] hover:border-[rgba(255,255,255,0.14)]"
                  }`}
                >
                  {/* Left border accent */}
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[#F4C95D]" />
                  )}

                  {/* Icon Box */}
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: colorTheme.bg,
                      borderColor: colorTheme.border,
                      color: colorTheme.text,
                    }}
                  >
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest font-poppins"
                        style={{ color: colorTheme.text }}
                      >
                        {category}
                      </span>

                      {/* Open / Closed Status Badge */}
                      {place.isOpen !== null && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            place.isOpen
                              ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                              : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20"
                          }`}
                        >
                          {place.isOpen ? "Open Now" : "Closed"}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white truncate font-inter">
                      {place.name}
                    </h4>
                    <p className="text-[10px] text-[#A5A8B5] truncate font-inter mt-0.5">
                      {place.vicinity}
                    </p>

                    {/* Metadata Row: Rating, Phone */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-[#A5A8B5] font-space-grotesk">
                      {place.rating && (
                        <span className="flex items-center gap-1 text-[#F4C95D] font-bold">
                          <Star className="w-3 h-3 fill-[#F4C95D]" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}

                      {place.phone && (
                        <a
                          href={`tel:${place.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 hover:text-white transition-all text-[#22C55E]"
                        >
                          <Phone className="w-3 h-3" />
                          {place.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Distance, ETA, Get Directions Button */}
                  <div className="text-right shrink-0 flex flex-col items-end">
                    {(place.distanceText || formatDistanceText(place.distanceKm)) && (
                      <span className="text-xs font-bold text-white font-space-grotesk block">
                        {place.distanceText || formatDistanceText(place.distanceKm)}
                      </span>
                    )}

                    {place.etaText && (
                      <span className="text-[9px] text-[#A5A8B5] font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {place.etaText}
                      </span>
                    )}

                    {/* Get Directions Button -> opens Google Maps Navigation directly */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlace(place);
                        openInGoogleMaps(place);
                      }}
                      className="mt-2.5 flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-[#F4C95D]/10 hover:bg-[#F4C95D]/20 text-[#F4C95D] border border-[#F4C95D]/30 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      Get Directions
                    </button>
                  </div>

                </motion.div>
              );
            })
          )}
        </div>

        {/* Right Column: Clean & Modern Embedded Map Container */}
        <div
          className="lg:col-span-7 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[24px] overflow-hidden flex flex-col shadow-lg"
          style={{ minHeight: "580px" }}
        >
          {/* Map Header */}
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[#0B0B12]/80 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-white font-poppins flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F4C95D]" />
              {userLocation ? "Current User Location" : "Location Not Detected"}
            </span>

            {userLocation ? (
              <span className="text-[9px] font-bold text-[#22C55E] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active GPS
              </span>
            ) : (
              <button
                onClick={() => detectUserLocation()}
                className="text-[9px] font-bold text-[#F4C95D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Compass className="w-3 h-3" />
                Detect Location
              </button>
            )}
          </div>

          {/* Google Map View */}
          <div className="flex-1 relative min-h-[440px]">
            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center h-full text-white space-y-2 p-6">
                <Loader2 className="w-6 h-6 animate-spin text-[#F4C95D]" />
                <span className="text-xs font-inter text-[#A5A8B5]">
                  Loading Google Maps Engine...
                </span>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  userLocation ||
                  (selected && getCoords(selected)
                    ? getCoords(selected)
                    : { lat: 30.7333, lng: 76.7794 })
                }
                zoom={userLocation ? 15 : 12}
                options={{
                  styles: darkMapStyle,
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: false,
                  streetViewControl: false,
                }}
                onLoad={(mapInstance) => {
                  setMap(mapInstance);
                  mapRef.current = mapInstance;
                  if (userLocation) {
                    mapInstance.panTo(userLocation);
                    mapInstance.setZoom(15);
                    // Trigger real Places search now that both location and map are ready
                    searchNearbyServices(userLocation, mapInstance);
                  }
                }}
              >
                {/* User's Actual Current Location Marker */}
                {userLocation && (
                  <Marker
                    position={userLocation}
                    title="Your Current Location"
                    icon={{
                      url: createUserLocationMarkerSvg(),
                      scaledSize: window.google ? new window.google.maps.Size(38, 38) : undefined,
                      anchor: window.google ? new window.google.maps.Point(19, 19) : undefined,
                    }}
                  />
                )}

                {/* Nearby Emergency Places Markers — Categorized SVG Marker Icons */}
                {filteredPlaces.map((place) => {
                  const coords = getCoords(place);
                  if (!coords) return null;
                  const isSelected = selected?.place_id === place.place_id;
                  const category = place.category || "Emergency Service";

                  return (
                    <Marker
                      key={place.place_id}
                      position={coords}
                      title={place.name}
                      onClick={() => handleSelectPlace(place)}
                      icon={{
                        url: createCategoryMarkerSvg(category, isSelected),
                        scaledSize: window.google
                          ? isSelected
                            ? new window.google.maps.Size(42, 50)
                            : new window.google.maps.Size(34, 42)
                          : undefined,
                        anchor: window.google
                          ? isSelected
                            ? new window.google.maps.Point(21, 50)
                            : new window.google.maps.Point(17, 42)
                          : undefined,
                      }}
                    />
                  );
                })}

                {/* Active Selected Place InfoWindow Popup */}
                {selected && getCoords(selected) && (
                  <InfoWindow
                    position={getCoords(selected)}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div
                      style={{
                        minWidth: "210px",
                        padding: "4px",
                        fontFamily: "Inter, sans-serif",
                        color: "#111827",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#D97706" }}>
                          {selected.category || "Emergency Help"}
                        </span>
                        {selected.rating && (
                          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#B45309", marginLeft: "auto" }}>
                            ★ {selected.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#111827" }}>
                        {selected.name}
                      </h4>
                      <p style={{ margin: "2px 0 6px 0", fontSize: "11px", color: "#4B5563" }}>
                        {selected.vicinity}
                      </p>

                      {(selected.distanceText || selected.etaText) && (
                        <p style={{ margin: "4px 0", fontSize: "11px", fontWeight: "600", color: "#059669" }}>
                          {selected.distanceText} {selected.etaText ? `• ${selected.etaText}` : ""}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                        {selected.phone && (
                          <a
                            href={`tel:${selected.phone}`}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: "#E5E7EB",
                              color: "#111827",
                              borderRadius: "6px",
                              padding: "6px 8px",
                              textDecoration: "none",
                              fontWeight: "bold",
                              fontSize: "11px",
                            }}
                          >
                            Call
                          </a>
                        )}

                        <button
                          onClick={() => openInGoogleMaps(selected)}
                          style={{
                            flex: 1,
                            background: "#F4C95D",
                            color: "#0B0B12",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "11px",
                          }}
                        >
                          Get Directions
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>

          {/* Map Footer Bar */}
          <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[#0B0B12]/60 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-white font-bold block truncate max-w-[180px] font-inter">
                {selected ? selected.name : "Select a nearby location"}
              </span>
              {selected?.distanceText && (
                <span className="text-[9px] text-[#22C55E] font-medium block">
                  {selected.distanceText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openInGoogleMaps(selected)}
                disabled={!selected}
                className="flex items-center gap-1 text-[#F4C95D] text-[10px] font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-3 h-3" />
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
