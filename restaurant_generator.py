import csv
import requests
from bs4 import BeautifulSoup

# This list will contain all the cities that will be passed into yelp api to get restaurant data
list_cities = []

# Function that gets the top 100 cities in florida by scraping a website and places it in list_cities
def getcities(list_cities):
    html = requests.get("https://www.florida-demographics.com/cities_by_population")
    soup = BeautifulSoup(html.text, "html.parser")
    list_cities_a = soup.find_all("a")
    actual_list_cities_a = list_cities_a[8:-9]
    for city in actual_list_cities_a:
        list_cities.append(city.text)

#Function that creates the data to write into the csv
def csvdatacreator(restaurant_list, restaurants):
        for restaurant in restaurants:
            restaurantname = restaurant["name"]
            restaurantrating = restaurant["rating"]
            restaurantlatitude = restaurant["coordinates"]["latitude"]
            restaurantlongitude = restaurant["coordinates"]["longitude"]
            tempdictionary = {"Restaurant name": restaurantname, "Restaurant Rating": restaurantrating,
                              "Restaurant latitude": restaurantlatitude, "Restaurant longitude": restaurantlongitude}
            restaurant_list.append(tempdictionary)

# Function that writes the csv data into csv file
def csvdatawriter(restaurant_list):
        fields = ["Restaurant name", "Restaurant Rating", "Restaurant latitude", "Restaurant longitude"]
        filename = "testdata.csv"

        with open(filename, "w") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fields)

            writer.writeheader()

            writer.writerows(restaurant_list)


getcities(list_cities)

#Keep track of amount of cities generated for testing purposes
amount_of_cities = 0

#The url used for the yelp api
Yelp_url = "https://api.yelp.com/v3/businesses/search?sort_by=best_match&limit=20"

#The headers required for the yelp api
Yelp_headers = {"accept": "application/json",
                "Authorization": "Bearer z443Oizo4G3j02LHspG3dN1v12Ecs0Q9TOf9Hn87YCWhhvUV-e-Lx2a6mSDHNovu1lJ1DuCirTeYn-16ym520JSeJamlRL_kqCkuFgFDVrQg1IsdZueW3mlbhlwZZnYx"
                }

#List that will hold all the restaurants in the area
restaurant_list = []

for city in list_cities:
    #params for yelp api
    Yelp_query_params = {"location": city,
                    "radius": 40000,
                    "offset": 700
                    }

    response = requests.get(Yelp_url, headers=Yelp_headers, params=Yelp_query_params)

    #List of restaruants
    restaurants = response.json()["businesses"]

    amount_of_cities += len(restaurants)

    csvdatacreator(restaurant_list, restaurants)

    csvdatawriter(restaurant_list)

    print(amount_of_cities)
