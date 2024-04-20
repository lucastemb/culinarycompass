"use client";

import React, { useState } from "react";
import {Graph} from "graph-data-structure";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};

const mapApiKey = "AIzaSyBrD8hrtxYjrK1TmSHnOZr68EkMJomqyMI"; //this should be changed to a secret later

export default function Search() {
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 29.6465,
    lng: -82.355659,
  });

  //calculate the distance between two points
  const haversineFormula = ({coord1}, {coord2}) => {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    const R = 6371; // Earth's radius in miles or kilometers
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in the chosen unit (miles or kilometers)
  }

  const createGraph = ({businesses}) => {
    let graph = Graph(); //initialize graph data structure.
    for(let i = 0; i < businesses.length; i++){
      graph.addNode(businesses[0].name);
      
    }
  }

  const searchRestaurants = async () => {
    const url = `http://localhost:3001/api/search?location=${encodeURIComponent(
      location
    )}&radius=${encodeURIComponent(
      radius
    )}&price=${price}&categories=${encodeURIComponent(category)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      setRestaurants(data.businesses || []);
      if (data.businesses.length > 0) {
        setMapCenter({
          lat: data.businesses[0].coordinates.latitude,
          lng: data.businesses[0].coordinates.longitude,
        });
      }
      createGraph(data.businesses);
    } else {
      console.error("Failed to fetch restaurants:", await response.text());
    }
  };

  const customIcon = (photoUrl) => {
    return {
      url: photoUrl,
      scaledSize: new window.google.maps.Size(50, 50),
      anchor: new window.google.maps.Point(25, 50),
      shape: {
        coords: [25, 25, 25],
        type: "circle",
      },
    };
  };

  return (
    <div className="relative w-full h-full">
      <LoadScript googleMapsApiKey={mapApiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={13}
        >
          {restaurants.map((restaurant) => (
            <Marker
              key={restaurant.id}
              position={{
                lat: restaurant.coordinates.latitude,
                lng: restaurant.coordinates.longitude,
              }}
              icon={customIcon(restaurant.image_url)}
              onClick={() => setSelectedPlace(restaurant)}
            />
          ))}
          {selectedPlace && (
            <InfoWindow
              position={{
                lat: selectedPlace.coordinates.latitude,
                lng: selectedPlace.coordinates.longitude,
              }}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div className="p-2">
                <h2 className="text-xl font-bold">{selectedPlace.name}</h2>
                <p className="text-lg">
                  {selectedPlace.categories.map((c) => c.title).join(", ")}
                </p>
                <img
                  src={selectedPlace.image_url}
                  alt={selectedPlace.name}
                  style={{
                    width: "200px",
                  }}
                />
                <div>
                  <a
                    href={`https://maps.google.com/?q=${selectedPlace.location.display_address.join(
                      ", "
                    )}`}
                    className="text-blue-500 hover:text-blue-800 text-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedPlace.location.display_address.join(", ")}
                  </a>
                </div>
                <p className="text-lg">
                  Rating: {selectedPlace.rating} stars (
                  {selectedPlace.review_count} reviews)
                </p>
                <a
                  href={selectedPlace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-800 text-lg"
                >
                  View on Yelp
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      <div className="absolute top-0 left-0 p-4 bg-white shadow-md">
        <h3 className="font-bold text-lg mb-3">Filters</h3>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
            className="input input-bordered w-full"
          />
          <input
            type="text"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            placeholder="Radius in miles"
            className="input input-bordered w-full"
          />
          <select
            className="select select-bordered w-full"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          >
            <option value="">N/A</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>
          <select
            className="select select-bordered w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">N/A</option>
            <option value="indian">Indian</option>
            <option value="sushi">Sushi</option>
            <option value="italian">Italian</option>
            <option value="mexican">Mexican</option>
            <option value="chinese">Chinese</option>
            <option value="thai">Thai</option>
            <option value="french">French</option>
            <option value="spanish">Spanish</option>
          </select>
          <button onClick={searchRestaurants} className="btn btn-primary mt-2">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}