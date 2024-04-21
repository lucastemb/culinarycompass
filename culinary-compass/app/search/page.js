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

  const cheapestInsertion = ({ graph }) => {
    const nodes = graph.nodes();
    const startNode = nodes[Math.floor(Math.random() * nodes.length)]; // Start from a random node
    let tour = [startNode]; // Initialize the tour with the starting node
    let unvisited = new Set(nodes);
    unvisited.delete(startNode); // Mark the starting node as visited

    // Function to calculate the cost of inserting a city into the tour
    const calculateInsertionCost = (city, tour) => {
      let minIncrease = Infinity;
      let bestIndex;
      for (let i = 0; i < tour.length; i++) {
          let currentCity = tour[i];
          let nextCity = tour[(i + 1) % tour.length]; // Wrap around to the first city if i reaches the end of the tour
          const distanceIncrease = graph.getEdgeWeight(currentCity, city) + graph.getEdgeWeight(city, nextCity) - graph.getEdgeWeight(currentCity, nextCity);
          if (distanceIncrease < minIncrease) {
              minIncrease = distanceIncrease;
              bestIndex = i + 1;
          }
      }
      return { index: bestIndex, increase: minIncrease };
    };

    // Main loop: Add each city to the tour
    while (unvisited.size > 0) {
        let bestCity;
        let bestInsertion;
        let minIncrease = Infinity;
        for (let city of unvisited) {
            const insertion = calculateInsertionCost(city, tour);
            if (insertion && insertion.increase < minIncrease) { // Check if insertion is defined
                minIncrease = insertion.increase;
                bestCity = city;
                bestInsertion = insertion;
            }
        }
        tour.splice(bestInsertion.index, 0, bestCity); // Insert the city into the tour
        unvisited.delete(bestCity); // Mark the city as visited
    }

    // Return to the starting city to complete the tour
    tour.push(startNode);

    return {
        tour,
        distance: calculateTourDistance({tour: tour, graph: graph})
    };
};



const calculateTourDistance = ({tour, graph}) => {
    let totalDistance = 0;
    for (let i = 0; i < tour.length - 1; i++) {
        console.log(graph.getEdgeWeight(tour[i],tour[i+1]));
        totalDistance += graph.getEdgeWeight(tour[i], tour[i + 1]);
    }
    return totalDistance;
};


const nearestNeighbor = ({graph}) => {
    const nodes = graph.nodes();
    const startNode = nodes[Math.floor(Math.random() * nodes.length)]; 
    let current = startNode;
    let unvisited = new Set(nodes);
    unvisited.delete(current); 
    let path = [current];
    let totalDistance = 0;

    while (unvisited.size > 0) {
        let nearestNeighbor;
        let minDistance = Infinity;
        for (let neighbor of unvisited) {
            const distance = graph.getEdgeWeight(current, neighbor);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNeighbor = neighbor;
            }
        }
        totalDistance += minDistance;
        current = nearestNeighbor;
        unvisited.delete(current);
        path.push(current);
    }

   
    totalDistance += graph.getEdgeWeight(current, startNode);
    path.push(startNode);

    return {
        path,
        totalDistance
    };
};

  // const dijkstra = ({graph}) => {
  //   let distances = {};
  //   let visited = new Set();
  //   let nodes = graph.nodes();

  //   //set the weight of all the distances set to Infinity initially
  //   for (let node of nodes){
  //     distances[node] = Infinity;
  //   }

  //   const start = Math.floor(Math.random() * nodes.length);
  //   distances[nodes[start]] = 0;
    
  //   while (nodes.length) {
  //     nodes.sort((a,b) => distances[a] - distances[b]);
  //     let closestNode = nodes.shift();
  //     if (distances[closestNode] === Infinity) break;
  //     visited.add(closestNode);

  //     console.log(visited);

  //     for(let index in graph.adjacent(closestNode)){
  //       let neighbor = graph.adjacent(closestNode)[index]
  //       if(!visited.has(neighbor)){
  //         let newDistance = distances[closestNode] + graph.getEdgeWeight(closestNode, neighbor);
  //         console.log(closestNode + ":" + neighbor)
  //         console.log(graph.getEdgeWeight(closestNode, neighbor));
  //         if(newDistance < distances[neighbor]){
  //           distances[neighbor] = newDistance;
  //         }
  //         // distances[neighbor] = newDistance;
  //       }
  //     } 
  //     console.log(distances); 
  //   }
  //   console.log(distances);
  //   return distances;
  // };

  //calculate the distance between two points
  const haversineFormula = ({coords1}, {coords2}) => {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    const R = 6371; // Earth's radius in miles or kilometers
    const dLat = toRad(coords2.latitude - coords1.latitude); //difference in latitude
    const dLon = toRad(coords2.longitude - coords1.longitude); //diference in longitude


    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude));
              Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in the chosen unit (miles or kilometers)
  }

  const createGraph = ({businesses}) => {
    let graph = Graph(); //initialize graph data structure.

    //populate graph with businesses
    for(let i = 0; i < businesses.length; i++){
      graph.addNode(businesses[i].name);
    }
    for(let i = 0; i < businesses.length; i++){
      for(let j = i+1; j < businesses.length; j++){
        graph.addEdge(businesses[i].name, businesses[j].name, haversineFormula({ coords1: businesses[i].coordinates}, { coords2: businesses[j].coordinates}));
        graph.addEdge(businesses[j].name, businesses[i].name, haversineFormula({ coords1: businesses[j].coordinates}, { coords2: businesses[i].coordinates}));
      }
    }
    return graph;
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
      const { path, totalDistance } = nearestNeighbor({graph: createGraph({businesses: data.businesses})});
      console.log("Shorest Path:", path);
      console.log("Shortest Distance:", totalDistance);

      const { tour, distance } = cheapestInsertion({graph: createGraph({businesses: data.businesses})});
      console.log("Tour:", tour);
      console.log("Total Distance:", distance);
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
