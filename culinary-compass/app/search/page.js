"use client";

import React, { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import Graph from "graph-data-structure";

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const mapApiKey = "AIzaSyBrD8hrtxYjrK1TmSHnOZr68EkMJomqyMI";

export default function RestaurantFinder() {
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
  const [nnPath, setNNPath] = useState([]);
  const [ciPath, setCIPath] = useState([]);
  const [nnTime, setNNTime] = useState(0);
  const [ciTime, setCITime] = useState(0);
  const [nnDistance, setNNDistance] = useState(0);
  const [ciDistance, setCIDistance] = useState(0);

  const fetchData = async () => {
    try {
      const url = `http://localhost:3001/api/search?location=${encodeURIComponent(
        location
      )}&radius=${encodeURIComponent(
        radius
      )}&price=${price}&categories=${encodeURIComponent(category)}`;
      const response = await fetch(url);
      const data = await response.json();
      setRestaurants(data.businesses);

      //conversion factor from kmToMiles
      const kmToMiles = 0.621371;

      const graph = createGraph(data.businesses);
      const startNode = 0;

      const startTimeNN = performance.now();
      const nnData = nearestNeighbor(startNode, graph);
      const endTimeNN = performance.now();
      setNNTime((endTimeNN - startTimeNN).toFixed(2));
      setNNPath(nnData.path);
      setNNDistance((nnData.totalDistance*kmToMiles).toFixed(2));

      const startTimeCI = performance.now();
      const ciData = cheapestInsertion(startNode, graph);
      const endTimeCI = performance.now();
      setCITime((endTimeCI - startTimeCI).toFixed(2));
      setCIPath(ciData.path);
      setCIDistance((ciData.totalDistance*kmToMiles).toFixed(2));

      if (
        data.region &&
        data.region.center &&
        !isNaN(data.region.center.latitude) &&
        !isNaN(data.region.center.longitude)
      ) {
        setMapCenter({
          lat: data.region.center.latitude,
          lng: data.region.center.longitude,
        });
      } else {
        console.error(
          "Invalid or missing center coordinates:",
          data.region.center
        );
        setMapCenter({
          lat: 29.6465,
          lng: -82.355659,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMapCenter({
        lat: 29.6465,
        lng: -82.355659,
      });
    }
  };

  const haversineDistance = (coords1, coords2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(coords1.latitude)) *
        Math.cos(toRad(coords2.latitude)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const createGraph = (businesses) => {
    let graph = Graph();
    businesses.forEach((business, index) => {
      graph.addNode(index.toString());
    });
    businesses.forEach((business1, i) => {
      businesses.forEach((business2, j) => {
        if (i !== j) {
          const distance = haversineDistance(
            business1.coordinates,
            business2.coordinates
          );
          graph.addEdge(i.toString(), j.toString(), distance);
          graph.addEdge(j.toString(), i.toString(), distance);
        }
      });
    });
    return graph;
  };

  const nearestNeighbor = (start, graph) => {
    let path = [start.toString()];
    let used = new Set(path);
    let currentNode = start.toString();
    let totalDistance = 0;

    while (path.length < graph.nodes().length) {
      let nextNode = graph
        .adjacent(currentNode)
        .filter((n) => !used.has(n))
        .reduce(
          (acc, n) =>
            !acc ||
            graph.getEdgeWeight(currentNode, n) <
              graph.getEdgeWeight(currentNode, acc)
              ? n
              : acc,
          null
        );

      if (!nextNode) break;
      totalDistance += graph.getEdgeWeight(currentNode, nextNode);
      path.push(nextNode);
      used.add(nextNode);
      currentNode = nextNode;
    }

    if (path.length > 1 && start.toString() !== currentNode) {
      totalDistance += graph.getEdgeWeight(currentNode, start.toString());
      path.push(start.toString());
    }

    return { path, totalDistance };
  };

  const cheapestInsertion = (start, graph) => {
    let tour = [start.toString()];
    let candidates = new Set(
      graph.nodes().filter((n) => n !== start.toString())
    );
    let totalDistance = 0;

    while (candidates.size > 0) {
      let bestCost = Infinity;
      let bestCandidate = null;
      let bestPosition = null;

      candidates.forEach((candidate) => {
        for (let i = 0; i < tour.length; i++) {
          let cost =
            graph.getEdgeWeight(tour[i], candidate) +
            graph.getEdgeWeight(candidate, tour[(i + 1) % tour.length]) -
            graph.getEdgeWeight(tour[i], tour[(i + 1) % tour.length]);

          if (cost < bestCost) {
            bestCost = cost;
            bestCandidate = candidate;
            bestPosition = i + 1;
          }
        }
      });

      if (bestCandidate !== null) {
        tour.splice(bestPosition, 0, bestCandidate);
        totalDistance += bestCost;
        candidates.delete(bestCandidate);
      }
    }

    if (tour.length > 1) {
      totalDistance += graph.getEdgeWeight(tour[tour.length - 1], tour[0]);
      tour.push(tour[0]);
    }

    return { path: tour, totalDistance };
  };

  return (
    <div className="flex w-full h-full">
      <div className="flex w-full">
        <LoadScript googleMapsApiKey={mapApiKey}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={12}
          >
            {restaurants.map((restaurant, idx) => (
              <Marker
                key={restaurant.id}
                position={{
                  lat: restaurant.coordinates.latitude,
                  lng: restaurant.coordinates.longitude,
                }}
                icon={{
                  url: restaurant.image_url,
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
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
                <div className="space-y-2">
                  <img
                    src={selectedPlace.image_url}
                    alt={selectedPlace.name}
                    className="w-[200px] h-auto"
                  />
                  <h2 className="text-lg font-bold">{selectedPlace.name}</h2>
                  <h2 className="text-lg">Rating: {selectedPlace.rating}</h2>
                  <p className="text-sm">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        selectedPlace.location.display_address.join(", ")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-800"
                    >
                      {selectedPlace.location.display_address.join(", ")}
                    </a>
                  </p>
                  <a
                    href={selectedPlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-800"
                  >
                    View on Yelp
                  </a>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
      <div className="w-1/5 overflow-hidden h-full bg-gray-100 p-4 space-y-4 absolute right-0 top-0">
        <div className="space-y-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="input input-bordered w-full"
          />
          <div className="flex flex-row">
          <p className="mr-2 text-center"> Miles: </p>
          <input
            type="range"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            min="0"
            max="24"
            step="1"
            placeholder="Radius in miles"
            className="input input-bordered w-full mr-4"
          />
          <span> {radius} </span>
          </div>
          <select
            className="select select-bordered w-full"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          >
            <option value="">Price Level</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
            <option value="4">$$$$</option>
          </select>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className="input input-bordered w-full"
          />
          <button
            onClick={fetchData}
            className="bg-blue-500 rounded-lg w-full py-1"
          >
            <h2 className="text-white">Search</h2>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
          <h3 className="text-lg font-bold">Nearest Neighbor Route</h3>
          <p>
            Distance: {nnDistance} mi, Time: {nnTime} ms
          </p>
          {nnPath.map((idx, index) => (
            <div
              key={index}
              className="cursor-pointer hover:bg-gray-200 p-2"
              onClick={() => setSelectedPlace(restaurants[idx])}
            >
              {`${index + 1}. ${
                restaurants[idx] ? restaurants[idx].name : "Unknown location"
              }`}
            </div>
          ))}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
          <h3 className="text-lg font-bold">Cheapest Insertion Route</h3>
          <p>
            Distance: {ciDistance} mi, Time: {ciTime} ms
          </p>
          {ciPath.map((idx, index) => (
            <div
              key={index}
              className="cursor-pointer hover:bg-gray-200 p-2"
              onClick={() => setSelectedPlace(restaurants[idx])}
            >
              {`${index + 1}. ${
                restaurants[idx] ? restaurants[idx].name : "Unknown location"
              }`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
