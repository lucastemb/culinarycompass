"use client";

import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  OverlayView,
  Polyline,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};

const center = {
  lat: 28.538336,
  lng: -81.379234,
};

const mapApiKey = "AIzaSyBrD8hrtxYjrK1TmSHnOZr68EkMJomqyMI";

export default function Search() {
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("10");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [isPathPopupVisible, setPathPopupVisible] = useState(false);

  const searchRestaurants = async () => {
    const url = `http://localhost:3001/api/shortest-path?location=${encodeURIComponent(
      location
    )}&radius=${encodeURIComponent(
      radius
    )}&price=${price}&categories=${encodeURIComponent(category)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      // Sort the data based on distance, ascending
      const sortedData = data.sort((a, b) => a.distance - b.distance);
      setRestaurants(sortedData);
      if (sortedData.length > 0) {
        setMapCenter({
          lat: sortedData[0].coordinates.latitude,
          lng: sortedData[0].coordinates.longitude,
        });
      }
    } else {
      console.error("Failed to fetch restaurants:", await response.text());
    }
  };

  const togglePathPopup = () => {
    setPathPopupVisible(!isPathPopupVisible);
  };

  const handleRestaurantSelect = (restaurant) => {
    setSelectedPlace(restaurant);
    setMapCenter({
      lat: restaurant.coordinates.latitude,
      lng: restaurant.coordinates.longitude,
    });
  };

  const metersToMiles = (meters) => {
    return (meters / 1609.344).toFixed(2); // Convert meters to miles
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 z-10 p-4 bg-white shadow-md w-[500px]">
        <h2 className="font-bold mb-2">Restaurant Finder</h2>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          placeholder="Radius in miles"
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price Level (1-4)"
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Food Category (e.g., sushi)"
          className="w-full mb-2 p-2 border rounded"
        />
        <button
          onClick={searchRestaurants}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Search
        </button>
        <button
          onClick={togglePathPopup}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2"
        >
          View Path
        </button>
        {isPathPopupVisible && (
          <div className=" bg-white w-full pt-10">
            <div className="flex justify-between ">
              <h2 className="font-bold text-lg mb-2">Shortest Path Details</h2>
              <button onClick={togglePathPopup} className="top-0 right-0 p-2">
                Close
              </button>
            </div>

            {restaurants.map((res, index) => (
              <p
                key={res.id}
                className="cursor-pointer"
                onClick={() => handleRestaurantSelect(res)}
              >
                {index + 1}. {res.name} - {res.address} -{" "}
                {metersToMiles(res.distance)} miles
              </p>
            ))}
          </div>
        )}
      </div>
      <LoadScript googleMapsApiKey={mapApiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={13}
        >
          {restaurants.map((restaurant) => (
            <OverlayView
              key={restaurant.id}
              position={{
                lat: restaurant.coordinates.latitude,
                lng: restaurant.coordinates.longitude,
              }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
                onClick={() => handleRestaurantSelect(restaurant)}
              />
            </OverlayView>
          ))}
          {selectedPlace && (
            <InfoWindow
              position={{
                lat: selectedPlace.coordinates.latitude,
                lng: selectedPlace.coordinates.longitude,
              }}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div>
                <h2>{selectedPlace.name}</h2>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedPlace.address
                  )}`}
                  target="_blank"
                  style={{ color: "blue" }}
                >
                  {selectedPlace.address}
                </a>
                <img
                  src={selectedPlace.image_url}
                  alt={selectedPlace.name}
                  style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                />
                <p>
                  <a
                    href={selectedPlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "blue" }}
                  >
                    View on Yelp
                  </a>
                </p>
              </div>
            </InfoWindow>
          )}
          <Polyline
            path={restaurants.map((restaurant) => ({
              lat: restaurant.coordinates.latitude,
              lng: restaurant.coordinates.longitude,
            }))}
            options={{
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#FF0000",
              fillOpacity: 0.35,
            }}
          />
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
