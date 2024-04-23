import csv
import requests
from bs4 import BeautifulSoup
import random
import math
import heapq
from datetime import datetime

#Prompt User for input which will be used to generate restarurants in that radius
#radius = input("Please enter how far the restaurants should be spaced apart from each other") 40

#List of cities that will be used to generate the datapoints required for backend
list_cities = []

#Function to get cities from an online database which will be used to generate restaurants all over florida
def getcities(list_cities):
    html = requests.get("https://www.florida-demographics.com/cities_by_population")
    soup = BeautifulSoup(html.text, "html.parser")
    list_cities_a = soup.find_all("a")
    actual_list_cities_a = list_cities_a[8:-9]
    for city in actual_list_cities_a:
        list_cities.append(city.text)

#Function that will create the csv data so that the backend can use it for sql
def csvdatacreator(restaurant_list, restaurants):
        for restaurant in restaurants:
            restaurantname = restaurant["name"]
            restaurantrating = restaurant["rating"]
            restaurantlatitude = restaurant["coordinates"]["latitude"]
            restaurantlongitude = restaurant["coordinates"]["longitude"]
            tempdictionary = {"Restaurant name": restaurantname, "Restaurant Rating": restaurantrating,
                              "Restaurant latitude": restaurantlatitude, "Restaurant longitude": restaurantlongitude}
            restaurant_list.append(tempdictionary)

#Functiojn that will write the csv data into a file so that the backend can use it
def csvdatawriter(restaurant_list):
        fields = ["Restaurant name", "Restaurant Rating", "Restaurant latitude", "Restaurant longitude"]
        filename = "testdata.csv"

        with open(filename, "w") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fields)

            writer.writeheader()

            writer.writerows(restaurant_list)

#Code that would gather restaruants and write them down into a csv file
'''
getcities(list_cities)

amount_of_cities = 0

Yelp_url = "https://api.yelp.com/v3/businesses/search?sort_by=best_match&limit=20"

Yelp_headers = {"accept": "application/json",
                "Authorization": "Bearer z443Oizo4G3j02LHspG3dN1v12Ecs0Q9TOf9Hn87YCWhhvUV-e-Lx2a6mSDHNovu1lJ1DuCirTeYn-16ym520JSeJamlRL_kqCkuFgFDVrQg1IsdZueW3mlbhlwZZnYx"
                }

#Restaurant list that will keep hold of all the various restaurants in various cities
restaurant_list = []

for city in list_cities:
    Yelp_query_params = {"location": city,
                    "radius": 40000,
                    "offset": 700
                    }

    response = requests.get(Yelp_url, headers=Yelp_headers, params=Yelp_query_params)

    restaurants = response.json()["businesses"]

    amount_of_cities += len(restaurants)

    csvdatacreator(restaurant_list, restaurants)

    csvdatawriter(restaurant_list)

    print(amount_of_cities)

'''

google_url = "https://maps.googleapis.com/maps/api/directions/json"

google_query_params = {"key": "API_KEY",
                       "origin": "Gainesville",
                        "destination": "Orlando"}

#current_time = datetime.now()
#Code that would get data regarding the direction to be taken from beginning to destination
response = requests.get(google_url, params=google_query_params)
directions = response.json()["routes"][0]["legs"][0]["steps"]
direction_list = []

distance = 0

Yelp_url = "https://api.yelp.com/v3/businesses/search?sort_by=best_match&limit=20"

Yelp_headers = {"accept": "application/json",
                "Authorization": "Bearer z443Oizo4G3j02LHspG3dN1v12Ecs0Q9TOf9Hn87YCWhhvUV-e-Lx2a6mSDHNovu1lJ1DuCirTeYn-16ym520JSeJamlRL_kqCkuFgFDVrQg1IsdZueW3mlbhlwZZnYx"
                }

restaurant_list = []

sum = 0

#Restarurant dictionary that will map restaurants to integers for future use
restaurant_dictionary = {}

coordinate_dictionary = {}

#Put stuff from beginning position and ending position into the restaurant_list
for direction in directions:
    print(direction)
    distance_text = direction["distance"]["text"]
    text_split = distance_text.split(" ", 1)
    miles_text = text_split[0]
    sum += float(miles_text)
    if sum > 40:  # Change this to input radius
        Yelp_query_params = {"latitude": direction["end_location"]["lat"],
                             "longitude": direction["end_location"]["lng"],
                             "radius": 40000,
                             "offset": 0
                             }
        yelp_response = requests.get(Yelp_url, headers=Yelp_headers, params=Yelp_query_params)

        restaurants = yelp_response.json()["businesses"]
        print(restaurants)
        for i in range(3):
            restaurant = random.choice(restaurants)
            restaurant_dictionary[restaurant["name"]] = len(restaurant_dictionary)
            coordinate_dictionary[restaurant["name"]] = (restaurant["coordinates"]["latitude"], restaurant["coordinates"]["longitude"])
            restaurant_list.append(restaurant["name"])
        sum = 0
    direction_list.append(direction["end_location"])

rows = len(restaurant_list)

#Create a vertex graph for  A*
two_d_list_zeros = [[0 for _ in range(rows)] for _ in range(rows)]

#Fill the vertex graph with edges
for key1 in restaurant_dictionary:
    for key2 in restaurant_dictionary:
        if key1 == key2:
            continue
        else:
            google_query_params = {"key": "AIzaSyDVy-49BqkQL_ZSZDzG_0ckrzrnd1LUYQU",
                                   "origin": f"{coordinate_dictionary[key1][0]}, {coordinate_dictionary[key1][1]}",
                                   "destination": f"{coordinate_dictionary[key2][0]}, {coordinate_dictionary[key2][1]}"}
            google_response = requests.get(google_url, params=google_query_params)
            print(google_response.json())
            distance_text = google_response.json()["routes"][0]["legs"][0]["distance"]["text"]
            text_split = distance_text.split(" ", 1)
            miles_text = text_split[0]
            two_d_list_zeros[restaurant_dictionary[key1]][restaurant_dictionary[key2]] = float(miles_text)

# AN work in progress A* implementation before issues were detceted and changes were made
'''
def Astar(G):

    #Potential of node in this case wil always be the last element any list
    #Thus change the code in such a way that the potential will always be the ending of the given list or something similar to it

    boundary_nodes = {0}
    distances = {0: 0}

    while len(boundary_nodes) != 0:
        for node in boundary_nodes.copy():

            boundary_nodes.remove(node)
            if node == len(restaurant_list)-1:
                return distances[node]

            for i in range(len(restaurant_list)):
                if G[node][i] == 0:
                    continue
                proposed_distance = distances[node] + G[node][i]
                if i not in distances or distances[i] > proposed_distance:
                    distances[i] = proposed_distance
                    boundary_nodes.add(i)

    return -1
'''

#response_time = datetime.now()

#changeintime = response_time-current_time

#print(changeintime)
