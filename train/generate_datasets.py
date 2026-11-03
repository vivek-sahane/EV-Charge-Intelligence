"""
EV Charge Intelligence - Dataset Generation Script
Generates representative, realistic datasets for Charging Stations, Country Growth, and EV Models.
"""
import os
import csv
import math
import random

# Fixed seed for reproducibility
random.seed(42)

# Directory setup
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets", "sample")
os.makedirs(OUT_DIR, exist_ok=True)

# 1. EV Models Dataset
EV_MODELS = [
    # Manufacturer, Model, Battery Capacity (kWh), Max Charging Power (kW), Vehicle Type
    ("Tesla", "Model 3 Long Range", 78.1, 250.0, "Sedan"),
    ("Tesla", "Model Y Performance", 78.1, 250.0, "SUV"),
    ("Tesla", "Model S Plaid", 100.0, 250.0, "Sedan"),
    ("Tesla", "Model X Dual Motor", 100.0, 250.0, "SUV"),
    ("Tesla", "Cybertruck All-Wheel Drive", 123.0, 350.0, "Pickup"),
    ("Porsche", "Taycan Turbo S", 93.4, 270.0, "Sports"),
    ("Porsche", "Macan EV Turbo", 100.0, 270.0, "SUV"),
    ("Audi", "e-tron GT quattro", 93.4, 270.0, "Sports"),
    ("Audi", "Q4 e-tron 50", 82.0, 135.0, "SUV"),
    ("Audi", "Q8 e-tron 55", 114.0, 170.0, "SUV"),
    ("Hyundai", "IONIQ 5 Long Range", 77.4, 233.0, "Crossover"),
    ("Hyundai", "IONIQ 6 Long Range", 77.4, 233.0, "Sedan"),
    ("Hyundai", "Kona Electric", 65.4, 100.0, "SUV"),
    ("Kia", "EV6 GT-Line", 77.4, 233.0, "Crossover"),
    ("Kia", "EV9 GT-Line", 99.8, 210.0, "SUV"),
    ("Kia", "Niro EV", 64.8, 85.0, "SUV"),
    ("BMW", "i4 M50", 83.9, 205.0, "Sedan"),
    ("BMW", "iX xDrive50", 111.5, 195.0, "SUV"),
    ("BMW", "i7 xDrive60", 105.7, 195.0, "Sedan"),
    ("Mercedes-Benz", "EQS 450+", 108.4, 200.0, "Sedan"),
    ("Mercedes-Benz", "EQE 350 4MATIC", 90.6, 170.0, "Sedan"),
    ("Mercedes-Benz", "EQB 300", 66.5, 100.0, "SUV"),
    ("Volkswagen", "ID.4 Pro", 82.0, 135.0, "SUV"),
    ("Volkswagen", "ID.Buzz Pro", 82.0, 170.0, "Van"),
    ("Volkswagen", "ID.3 Pro Performance", 62.0, 120.0, "Hatchback"),
    ("Ford", "Mustang Mach-E GT", 98.8, 150.0, "SUV"),
    ("Ford", "F-150 Lightning Extended", 131.0, 155.0, "Pickup"),
    ("Ford", "E-Transit 350", 68.0, 115.0, "Van"),
    ("Rivian", "R1T Quad-Motor", 135.0, 220.0, "Pickup"),
    ("Rivian", "R1S Adventure", 135.0, 220.0, "SUV"),
    ("Lucid", "Air Grand Touring", 112.0, 300.0, "Sedan"),
    ("Polestar", "Polestar 2 Long Range", 82.0, 205.0, "Sedan"),
    ("Polestar", "Polestar 3 Long Range", 111.0, 250.0, "SUV"),
    ("Polestar", "Polestar 4 Long Range", 100.0, 200.0, "SUV"),
    ("Volvo", "EX30 Ultra Single Motor", 69.0, 153.0, "SUV"),
    ("Volvo", "EX90 Twin Motor", 111.0, 250.0, "SUV"),
    ("Volvo", "XC40 Recharge", 82.0, 200.0, "SUV"),
    ("Nissan", "Ariya e-4ORCE", 91.0, 130.0, "SUV"),
    ("Nissan", "Leaf SV PLUS", 60.0, 50.0, "Hatchback"),
    ("Chevrolet", "Blazer EV RS", 102.0, 190.0, "SUV"),
    ("Chevrolet", "Equinox EV LT", 85.0, 150.0, "SUV"),
    ("Chevrolet", "Silverado EV 4WT", 200.0, 350.0, "Pickup"),
    ("BYD", "Seal Excellence AWD", 82.5, 150.0, "Sedan"),
    ("BYD", "Atto 3 Design", 60.5, 88.0, "SUV"),
    ("BYD", "Han EV 4WD", 85.4, 120.0, "Sedan"),
    ("BYD", "Dolphin Comfort", 60.4, 88.0, "Hatchback"),
    ("BYD", "Tang Flagship", 108.8, 170.0, "SUV"),
    ("Genesis", "GV60 Performance", 77.4, 235.0, "SUV"),
    ("Genesis", "Electrified G80", 87.2, 187.0, "Sedan"),
    ("Toyota", "bZ4X Limited AWD", 72.8, 100.0, "SUV"),
    ("Lexus", "RZ 450e", 71.4, 150.0, "SUV"),
    ("Subaru", "Solterra Limited", 72.8, 100.0, "SUV"),
    ("Mini", "Cooper SE", 54.2, 95.0, "Hatchback"),
    ("Renault", "Megane E-Tech EV60", 60.0, 130.0, "Hatchback"),
    ("Peugeot", "e-208 GT", 51.0, 100.0, "Hatchback"),
    ("MG", "MG4 EV XPOWER", 64.0, 140.0, "Hatchback"),
    ("MG", "ZS EV Long Range", 72.6, 92.0, "SUV"),
    ("NIO", "ET7 100kWh", 100.0, 180.0, "Sedan"),
    ("NIO", "ES8 Ultra", 100.0, 180.0, "SUV"),
    ("XPeng", "G9 AWD Performance", 98.0, 300.0, "SUV"),
    ("Zeekr", "001 AWD", 100.0, 200.0, "Sedan"),
    ("Lotus", "Eletre R", 112.0, 355.0, "SUV")
]

def generate_ev_models():
    filepath = os.path.join(OUT_DIR, "ev_models.csv")
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["manufacturer", "model", "battery_capacity_kwh", "max_charging_power_kw", "vehicle_type"])
        for row in EV_MODELS:
            writer.writerow(row)
    print(f"Generated {len(EV_MODELS)} EV models at {filepath}")

# 2. Country Growth Dataset
# Realistic base infrastructure values for major countries
COUNTRIES = [
    {"country": "China", "station_count": 220000, "port_count": 1850000, "fast_station_share": 0.42, "median_power_kw": 120.0},
    {"country": "United States", "station_count": 68000, "port_count": 195000, "fast_station_share": 0.28, "median_power_kw": 150.0},
    {"country": "Germany", "station_count": 38000, "port_count": 125000, "fast_station_share": 0.24, "median_power_kw": 110.0},
    {"country": "Netherlands", "station_count": 32000, "port_count": 145000, "fast_station_share": 0.18, "median_power_kw": 50.0},
    {"country": "France", "station_count": 34000, "port_count": 118000, "fast_station_share": 0.22, "median_power_kw": 90.0},
    {"country": "United Kingdom", "station_count": 31000, "port_count": 62000, "fast_station_share": 0.26, "median_power_kw": 120.0},
    {"country": "Norway", "station_count": 12500, "port_count": 32000, "fast_station_share": 0.45, "median_power_kw": 175.0},
    {"country": "Sweden", "station_count": 9200, "port_count": 28000, "fast_station_share": 0.31, "median_power_kw": 130.0},
    {"country": "South Korea", "station_count": 45000, "port_count": 280000, "fast_station_share": 0.23, "median_power_kw": 100.0},
    {"country": "Japan", "station_count": 29000, "port_count": 41000, "fast_station_share": 0.29, "median_power_kw": 90.0},
    {"country": "Canada", "station_count": 11500, "port_count": 29000, "fast_station_share": 0.27, "median_power_kw": 125.0},
    {"country": "India", "station_count": 14500, "port_count": 26000, "fast_station_share": 0.35, "median_power_kw": 60.0},
    {"country": "Australia", "station_count": 4800, "port_count": 9800, "fast_station_share": 0.38, "median_power_kw": 150.0},
    {"country": "Italy", "station_count": 18500, "port_count": 42000, "fast_station_share": 0.19, "median_power_kw": 75.0},
    {"country": "Spain", "station_count": 16200, "port_count": 34000, "fast_station_share": 0.25, "median_power_kw": 90.0},
    {"country": "Belgium", "station_count": 14000, "port_count": 45000, "fast_station_share": 0.21, "median_power_kw": 80.0},
    {"country": "Switzerland", "station_count": 8200, "port_count": 16500, "fast_station_share": 0.32, "median_power_kw": 140.0},
    {"country": "Austria", "station_count": 7900, "port_count": 18500, "fast_station_share": 0.28, "median_power_kw": 115.0},
    {"country": "Denmark", "station_count": 6800, "port_count": 19500, "fast_station_share": 0.34, "median_power_kw": 135.0},
    {"country": "Finland", "station_count": 5200, "port_count": 14200, "fast_station_share": 0.36, "median_power_kw": 145.0},
    {"country": "Portugal", "station_count": 4800, "port_count": 10500, "fast_station_share": 0.30, "median_power_kw": 95.0},
    {"country": "Poland", "station_count": 3900, "port_count": 7800, "fast_station_share": 0.33, "median_power_kw": 90.0},
    {"country": "New Zealand", "station_count": 2400, "port_count": 4900, "fast_station_share": 0.40, "median_power_kw": 120.0},
    {"country": "Brazil", "station_count": 4100, "port_count": 6800, "fast_station_share": 0.22, "median_power_kw": 50.0},
    {"country": "Mexico", "station_count": 2900, "port_count": 5200, "fast_station_share": 0.26, "median_power_kw": 60.0},
    {"country": "Singapore", "station_count": 3100, "port_count": 7200, "fast_station_share": 0.25, "median_power_kw": 100.0},
    {"country": "United Arab Emirates", "station_count": 1800, "port_count": 3900, "fast_station_share": 0.45, "median_power_kw": 150.0},
    {"country": "Saudi Arabia", "station_count": 950, "port_count": 2100, "fast_station_share": 0.50, "median_power_kw": 160.0},
    {"country": "South Africa", "station_count": 780, "port_count": 1450, "fast_station_share": 0.35, "median_power_kw": 80.0},
    {"country": "Ireland", "station_count": 2600, "port_count": 5400, "fast_station_share": 0.31, "median_power_kw": 100.0},
    {"country": "Czech Republic", "station_count": 2800, "port_count": 5900, "fast_station_share": 0.28, "median_power_kw": 85.0},
    {"country": "Hungary", "station_count": 2200, "port_count": 4500, "fast_station_share": 0.27, "median_power_kw": 75.0},
    {"country": "Greece", "station_count": 2100, "port_count": 4100, "fast_station_share": 0.24, "median_power_kw": 65.0},
    {"country": "Turkey", "station_count": 4500, "port_count": 9200, "fast_station_share": 0.38, "median_power_kw": 120.0},
    {"country": "Chile", "station_count": 890, "port_count": 1650, "fast_station_share": 0.41, "median_power_kw": 90.0},
    {"country": "Thailand", "station_count": 3200, "port_count": 7400, "fast_station_share": 0.36, "median_power_kw": 90.0},
    {"country": "Malaysia", "station_count": 1900, "port_count": 3800, "fast_station_share": 0.33, "median_power_kw": 80.0},
    {"country": "Indonesia", "station_count": 1200, "port_count": 2300, "fast_station_share": 0.39, "median_power_kw": 70.0},
    {"country": "Vietnam", "station_count": 3800, "port_count": 8900, "fast_station_share": 0.44, "median_power_kw": 85.0},
    {"country": "Romania", "station_count": 1600, "port_count": 3300, "fast_station_share": 0.29, "median_power_kw": 75.0}
]

def calculate_growth_index(station_count, port_count, fast_station_share, median_power_kw):
    # Log-scaled volume factor to handle wide ranges naturally
    log_stn = math.log10(max(10, station_count))
    log_port = math.log10(max(20, port_count))
    port_per_station = min(12.0, port_count / max(1, station_count))
    
    # Balanced formula capturing infrastructure momentum, power depth and fast charger prevalence
    score = (
        12.0 * log_stn +
        14.0 * log_port +
        2.5 * port_per_station +
        28.0 * fast_station_share +
        0.14 * median_power_kw - 45.0
    )
    # Add small deterministic noise to simulate realistic market variance without destroying signal
    noise = random.gauss(0, 1.8)
    final_score = max(5.0, min(99.0, score + noise))
    return round(final_score, 2)

def generate_country_growth():
    filepath = os.path.join(OUT_DIR, "country_growth.csv")
    rows = []
    
    # Generate 150 country / regional rows (including base countries and regional variants/provinces)
    for c in COUNTRIES:
        # Base country
        f_growth = calculate_growth_index(
            c["station_count"], c["port_count"], c["fast_station_share"], c["median_power_kw"]
        )
        rows.append([
            c["country"], c["station_count"], c["port_count"],
            c["fast_station_share"], c["median_power_kw"], f_growth
        ])
        
        # Add regional samples for diverse evaluation (e.g. state/provincial scale)
        for i in range(1, 4):
            factor = random.uniform(0.15, 0.75)
            s_cnt = int(c["station_count"] * factor)
            p_cnt = int(c["port_count"] * factor * random.uniform(0.85, 1.15))
            f_share = round(min(0.85, max(0.10, c["fast_station_share"] + random.uniform(-0.06, 0.08))), 3)
            med_pwr = round(min(250.0, max(30.0, c["median_power_kw"] + random.uniform(-20, 25))), 1)
            g_idx = calculate_growth_index(s_cnt, p_cnt, f_share, med_pwr)
            rows.append([
                f"{c['country']} - Region {i}", s_cnt, p_cnt, f_share, med_pwr, g_idx
            ])

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["country", "station_count", "port_count", "fast_station_share", "median_power_kw", "future_growth_index"])
        for r in rows:
            writer.writerow(r)
    print(f"Generated {len(rows)} country growth records at {filepath}")

# 3. Charging Stations Dataset
# Real cities with accurate geographic coordinates
CITIES = [
    # US
    ("New York", "United States", 40.7128, -74.0060),
    ("Los Angeles", "United States", 34.0522, -118.2437),
    ("San Francisco", "United States", 37.7749, -122.4194),
    ("Seattle", "United States", 47.6062, -122.3321),
    ("Chicago", "United States", 41.8781, -87.6298),
    ("Austin", "United States", 30.2672, -97.7431),
    ("Miami", "United States", 25.7617, -80.1918),
    ("Denver", "United States", 39.7392, -104.9903),
    ("Boston", "United States", 42.3601, -71.0589),
    ("Atlanta", "United States", 33.7490, -84.3880),
    # Europe
    ("Berlin", "Germany", 52.5200, 13.4050),
    ("Munich", "Germany", 48.1351, 11.5820),
    ("Frankfurt", "Germany", 50.1109, 8.6821),
    ("Hamburg", "Germany", 53.5511, 9.9937),
    ("Amsterdam", "Netherlands", 52.3676, 4.9041),
    ("Rotterdam", "Netherlands", 51.9244, 4.4777),
    ("Utrecht", "Netherlands", 52.0907, 5.1214),
    ("Paris", "France", 48.8566, 2.3522),
    ("Lyon", "France", 45.7640, 4.8357),
    ("Marseille", "France", 43.2965, 5.3698),
    ("London", "United Kingdom", 51.5074, -0.1278),
    ("Manchester", "United Kingdom", 53.4808, -2.2426),
    ("Edinburgh", "United Kingdom", 55.9533, -3.1883),
    ("Oslo", "Norway", 59.9139, 10.7522),
    ("Bergen", "Norway", 60.3913, 5.3221),
    ("Trondheim", "Norway", 63.4305, 10.3951),
    ("Stockholm", "Sweden", 59.3293, 18.0686),
    ("Gothenburg", "Sweden", 57.7089, 11.9746),
    ("Zurich", "Switzerland", 47.3769, 8.5417),
    ("Vienna", "Austria", 48.2082, 16.3738),
    ("Copenhagen", "Denmark", 55.6761, 12.5683),
    ("Helsinki", "Finland", 60.1699, 24.9384),
    ("Milan", "Italy", 45.4642, 9.1900),
    ("Rome", "Italy", 41.9028, 12.4964),
    ("Madrid", "Spain", 40.4168, -3.7038),
    ("Barcelona", "Spain", 41.3879, 2.1699),
    # Asia
    ("Shanghai", "China", 31.2304, 121.4737),
    ("Beijing", "China", 39.9042, 116.4074),
    ("Shenzhen", "China", 22.5431, 114.0579),
    ("Guangzhou", "China", 23.1291, 113.2644),
    ("Tokyo", "Japan", 35.6762, 139.6503),
    ("Osaka", "Japan", 34.6937, 135.5023),
    ("Seoul", "South Korea", 37.5665, 126.9780),
    ("Busan", "South Korea", 35.1796, 129.0756),
    ("Singapore", "Singapore", 1.3521, 103.8198),
    ("New Delhi", "India", 28.6139, 77.2090),
    ("Mumbai", "India", 19.0760, 72.8777),
    ("Bengaluru", "India", 12.9716, 77.5946),
    ("Hyderabad", "India", 17.3850, 78.4867),
    # Other continents
    ("Toronto", "Canada", 43.6532, -79.3832),
    ("Vancouver", "Canada", 49.2827, -123.1207),
    ("Sydney", "Australia", -33.8688, 151.2093),
    ("Melbourne", "Australia", -37.8136, 144.9631),
    ("Brisbane", "Australia", -27.4698, 153.0251),
    ("Dubai", "United Arab Emirates", 25.2048, 55.2708),
    ("São Paulo", "Brazil", -23.5505, -46.6333)
]

STATION_PREFIXES = [
    "VoltHub", "ElectraPoint", "SuperCharge Hub", "HyperPower Station", "CleanWatts",
    "EcoCurrent", "NexGen EV Plaza", "AmpPark", "PulsePoint", "GreenGrid Express",
    "PowerFlow Park", "TerraWatt Depot", "SparkPoint", "Orbital Charge", "Apex Charger"
]

def calculate_demand_score(station_count, port_count, fast_station_share, fast_port_share, median_power_kw):
    # Non-linear combination modeling realistic EV charging hub demand score [0-100]
    log_stn = math.log10(max(1, station_count))
    log_port = math.log10(max(1, port_count))
    port_ratio = port_count / max(1, station_count)
    
    score = (
        18.0 * log_stn +
        22.0 * log_port +
        15.0 * fast_station_share +
        18.0 * fast_port_share +
        0.12 * median_power_kw +
        1.5 * min(10.0, port_ratio) - 15.0
    )
    noise = random.gauss(0, 2.5)
    final_score = max(5.0, min(99.0, score + noise))
    return round(final_score, 2)

def generate_charging_stations():
    filepath = os.path.join(OUT_DIR, "charging_stations.csv")
    rows = []
    
    stn_idx = 1
    # For each city, generate multiple realistic charging stations / hub locations nearby
    for city, country, lat, lon in CITIES:
        # Generate 10 to 18 stations per city cluster
        num_stations = random.randint(12, 18)
        for i in range(num_stations):
            station_id = f"EV-STN-{stn_idx:05d}"
            prefix = random.choice(STATION_PREFIXES)
            station_name = f"{prefix} {city} #{i+1}"
            
            # Scatter coordinates within ~15 km of city center
            # 1 deg latitude is approx 111 km, longitude scaled by cos(lat)
            lat_jitter = random.gauss(0, 0.05)
            lon_jitter = random.gauss(0, 0.05 / max(0.2, math.cos(math.radians(lat))))
            stn_lat = round(lat + lat_jitter, 6)
            stn_lon = round(lon + lon_jitter, 6)
            
            station_count = random.randint(2, 45)
            port_count = int(station_count * random.uniform(1.8, 4.5))
            fast_station_share = round(random.uniform(0.15, 0.85), 3)
            fast_port_share = round(min(0.95, max(0.10, fast_station_share + random.uniform(-0.1, 0.1))), 3)
            
            # Power options
            power_tier = random.choice([50.0, 75.0, 100.0, 120.0, 150.0, 175.0, 200.0, 250.0, 300.0, 350.0])
            charging_power_kw = power_tier
            median_power_kw = round(charging_power_kw * random.uniform(0.75, 1.0), 1)
            
            demand_score = calculate_demand_score(
                station_count, port_count, fast_station_share, fast_port_share, median_power_kw
            )
            
            rows.append([
                station_id, station_name, country, city, stn_lat, stn_lon,
                station_count, port_count, charging_power_kw,
                fast_station_share, fast_port_share, median_power_kw, demand_score
            ])
            stn_idx += 1

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "station_id", "station_name", "country", "city", "latitude", "longitude",
            "station_count", "port_count", "charging_power_kw",
            "fast_station_share", "fast_port_share", "median_power_kw", "demand_score"
        ])
        for r in rows:
            writer.writerow(r)
    print(f"Generated {len(rows)} charging stations at {filepath}")

if __name__ == "__main__":
    generate_ev_models()
    generate_country_growth()
    generate_charging_stations()
