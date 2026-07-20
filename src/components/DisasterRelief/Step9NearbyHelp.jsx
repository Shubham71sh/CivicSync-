import React, { useState, useEffect } from "react";
import {
GoogleMap,
Marker,
InfoWindow,
useJsApiLoader,
} from "@react-google-maps/api";
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
import { MapPin, Phone, Navigation, Heart, ShieldAlert, Zap, Landmark, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";

const libraries = ["places"];

const iconMap = {
  "Relief Camp": Landmark,
  "Hospital": Heart,
  "Police Station": ShieldAlert,
  "Food Center": HeartHandshake,
  "Electricity Office": Zap,
};

const defaultColor = {
  "Relief Camp": "#F4C95D",
  "Hospital": "#EF4444",
  "Police Station": "#A5A8B5",
  "Food Center": "#22C55E",
  "Electricity Office": "#F59E0B",
};



// Positions for the mock map pins (percentage values)
const PIN_POSITIONS = [
  { x: "42%", y: "44%" },
  { x: "65%", y: "28%" },
  { x: "26%", y: "60%" },
  { x: "33%", y: "30%" },
  { x: "72%", y: "65%" },
];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export default function Step9NearbyHelp({
    services = [],
}) {
  const [selected, setSelected] = useState(null);

const [userLocation, setUserLocation] = useState(null);

const mockPlaces = [
  {
    place_id: "1",
    name: "Civil Hospital Chandigarh",
    vicinity: "Sector 16, Chandigarh",
    rating: 4.6,
    business_status: "OPERATIONAL",
    geometry: {
      location: {
        lat: () => 30.7415,
        lng: () => 76.7680,
      },
    },
  },
  {
    place_id: "2",
    name: "Punjab Police Headquarters",
    vicinity: "Sector 9, Chandigarh",
    rating: 4.4,
    business_status: "OPERATIONAL",
    geometry: {
      location: {
        lat: () => 30.7480,
        lng: () => 76.7935,
      },
    },
  },
  {
    place_id: "3",
    name: "Flood Relief Camp Mohali",
    vicinity: "Phase 7, Mohali",
    rating: 4.7,
    business_status: "OPERATIONAL",
    geometry: {
      location: {
        lat: () => 30.7046,
        lng: () => 76.7179,
      },
    },
  },
  {
    place_id: "4",
    name: "Community Food Center",
    vicinity: "Zirakpur",
    rating: 4.5,
    business_status: "OPERATIONAL",
    geometry: {
      location: {
        lat: () => 30.6425,
        lng: () => 76.8173,
      },
    },
  },
];

const [map, setMap] = useState(null);
const [nearbyPlaces, setNearbyPlaces] = useState([]);

useEffect(() => {
  setNearbyPlaces(mockPlaces);
  setSelected(mockPlaces[0]);
}, []);

const { isLoaded } = useJsApiLoader({
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  libraries,
});

useEffect(() => {
  console.log("Selected Service:", selected);
}, [selected]);

useEffect(() => {
  setUserLocation({
    lat: 30.7333,
    lng: 76.7794, // Chandigarh, Punjab region
  });
}, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-poppins">Nearby Emergency Help</h3>
          <p className="text-xs text-[#A5A8B5] font-inter">Active relief resources, shelters, and emergency contacts within your district</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E] text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          Live Data
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Service List (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {nearbyPlaces.map((place) => {
            const Icon = Landmark;
            const isSelected = selected?.place_id === place.place_id;

            return (
              <motion.div
                key={place.place_id}
                onClick={() => setSelected(place)}
                whileHover={{ x: 2 }}
                className={`p-4 rounded-[20px] border cursor-pointer transition-all duration-300 flex items-center gap-4 relative overflow-hidden ${
                  isSelected
                    ? "border-[rgba(244,201,93,0.2)] bg-[#11131A] shadow-[0_0_20px_rgba(244,201,93,0.04)]"
                    : "border-[rgba(255,255,255,0.06)] bg-[#11131A] hover:border-[rgba(255,255,255,0.12)]"
                }`}
              >
                {/* Gold left border accent */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-[#F4C95D]" />
                )}

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: "#F4C95D20",
                    borderColor: "#F4C95D40",
                    color: "#F4C95D",
                  }}
                >
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest font-poppins" style={{ color: "#F4C95D" }}>
                      Emergency Service
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate font-inter">{place.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[#A5A8B5] font-semibold font-space-grotesk">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone unavailable
                    </span>
                    <span className="text-[#22C55E]">
  Open
</span>
                  </div>
                </div>

                {/* Distance + Time */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-white font-space-grotesk block">Nearby</span>
                  <span className="text-[9px] text-[#A5A8B5] font-medium">-- drive</span>
                  <button className="mt-2 flex items-center gap-1 text-[#F4C95D] text-[9px] font-bold hover:underline ml-auto">
                    <Navigation className="w-2.5 h-2.5" />
                    Route
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Interactive Map Placeholder (2 cols) */}
        <div className="lg:col-span-2 bg-[#11131A] border border-[rgba(255,255,255,0.08)] rounded-[20px] overflow-hidden flex flex-col" style={{ minHeight: "380px" }}>
          {/* Map Header */}
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[#0B0B12]/60 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-white font-poppins flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F4C95D]" />
              Current Location
            </span>
            <span className="text-[9px] font-bold text-[#22C55E]">
  Nearby
</span>
          </div>

          {/* SVG Vector Map */}
          <div className="flex-1">

{!isLoaded ? (

<div className="flex items-center justify-center h-full text-white">
Loading Google Maps...
</div>

) : (

<GoogleMap
  mapContainerStyle={mapContainerStyle}
  center={
    userLocation || {
      lat: 25.5941,
      lng: 85.1376,
    }
  }
  onLoad={(mapInstance) => {
  setMap(mapInstance);

  if (userLocation) {
    mapInstance.panTo(userLocation);
  }
}}zoom={14}
>

{userLocation && (
  <Marker
    position={userLocation}
    title="Your Current Location"
    icon={{
      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    }}
  />
)}

{nearbyPlaces.map((place) => (

<Marker
    key={place.place_id}
    position={{
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
    }}
    onClick={() => setSelected(place)}
/>

))}

{selected && (

<InfoWindow
position={{
    lat: selected.geometry.location.lat(),
    lng: selected.geometry.location.lng(),
}}
onCloseClick={()=>setSelected(null)}
>

<div
  style={{
    minWidth: "220px",
    padding: "8px",
    fontFamily: "Arial",
  }}
>
  <h3
    style={{
      margin: 0,
      fontSize: "16px",
      fontWeight: "700",
      color: "#111827",
    }}
  >
    {selected.name}
  </h3>

 <p>{selected.vicinity}</p>

<p>
⭐ {selected.rating || "No rating"}
</p>

<p>
Status:
{selected.business_status}
</p>

  <button
    onClick={() => {
      const destination = selected.geometry.location;

     if (!userLocation) return;

window.open(
`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${destination.lat()},${destination.lng()}`,
"_blank"
);
    }}
    style={{
      marginTop: "8px",
      background: "#F4C95D",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Get Directions
  </button>
</div>

</InfoWindow>

)}

</GoogleMap>

)}

</div>

          {/* Map Footer */}
          <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[#0B0B12]/40 flex items-center justify-between">
            <span className="text-[10px] text-white font-bold truncate max-w-[160px] font-inter">
              {selected?.name}
            </span>
            <button
  onClick={() => {
  if (!selected || !userLocation) return;

const destination = selected.geometry.location;

window.open(
`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${destination.lat()},${destination.lng()}`,
"_blank"
);
}}
  className="flex items-center gap-1 text-[#F4C95D] text-[9px] font-bold hover:underline"
>
  <Navigation className="w-3 h-3" />
  Get Directions
</button>
          </div>
        </div>
      </div>
    </div>
  );
}
