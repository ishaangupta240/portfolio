from flightradar24.api import FlightRadar24API
fr_api = FlightRadar24API()

flights = fr_api.get_flights()

with open('flights.txt', 'w') as f:
    for flight in flights:
        f.write(f"{flight}\n")