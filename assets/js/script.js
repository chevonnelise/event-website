
document.addEventListener("DOMContentLoaded", async function () {

    // ----------------------------------------------------- Section 1: Welcome ----------------------------------------------//
    // Play button
    document.getElementById("play-button").addEventListener("click", function () {
        // Display the play button modal
        document.getElementById("play-button-modal").style.display = "block";
    });

    // Close the play button modal when the close button is clicked
    document.getElementsByClassName("close")[0].addEventListener("click", function () {
        document.getElementById("play-button-modal").style.display = "none";
    });
    // ------------------------------------------------- End of Section 1: Welcome ------------------------------------------//


    // -------------------------------------------------- Section 2: Event Venue ----------------------------------------------//
    // Map setup
    const map = L.map('map').setView([1.3521, 103.8198], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);

    // Define searchLayer as a layer group
    const searchLayer = L.layerGroup();
    searchLayer.addTo(map);

    // ----------------------- Create venue marker cluster group -----------------------//
    const venueClusterLayer = L.markerClusterGroup({
        iconCreateFunction: function (cluster) {
            const childCount = cluster.getChildCount();

            // add pink microphone marker to venue marker cluster group
            return L.divIcon({
                html: `<div class="venue-cluster-icon"><img src="assets/img/map-markers/microphone.png">${childCount}</div>`,
                className: 'venue-cluster',
                iconSize: L.point(100, 100)
            });
        }
    });

    // ------------------------------ Add venue marker ---------------------------------//
    // add customised geojson to unique venue marker 
    const venueResponse = await axios.get('assets/data/venue.geojson');
    for (let venue of venueResponse.data.features) {
        let reversedCoordinates = [venue.geometry.coordinates[1], venue.geometry.coordinates[0]]; // Reverse coordinates

        // Create yellow microphone marker as unique venue marker 
        const venueIcon = L.icon({
            iconUrl: 'assets/img/map-markers/microphone-zoom.png',
            iconSize: [40, 40],
            iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
            popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
        });

        // Create marker with venue icon
        const venueMarker = L.marker(reversedCoordinates, { icon: venueIcon }).bindPopup(`<h3>${venue.properties.Stadium}</h3><h5>${venue.properties.Country} (${venue.properties["City/State"]})</h5>`);

        // Add marker to cluster layer
        venueClusterLayer.addLayer(venueMarker);

        // Add mouseover event listener
        venueMarker.on('mouseover', function (event) {
            venueMarker.openPopup(); // Open popup on mouseover
        });
        // Add mouseout event listener
        venueMarker.on('mouseout', function (event) {
            venueMarker.closePopup(); // Close popup on mouseout
        });
    }
    // ---------------------------- End of venue markers -----------------------------//

    // --------------------------- Add search function and markers ----------------------------//
    // Foursquare API
    const BASE_API_URL = "https://api.foursquare.com/v3";
    const API_KEY = "fsq3wvnLGd2aP9AqDQAVE8JuRvhzlab05d3vi2sdPjueMNE="

    //Add searched Foursquare API markers to a map
    async function addMarkersToMap(searchResults, layer, map) {
        // Remove all existing markers from the provided layer
        layer.clearLayers();

        // resetting the content of the element before adding new content 
        const searchResultOutput = document.querySelector("#search-results");
        searchResultOutput.innerHTML = ""; // empty string to clear and reset searchResultOutput

        // Create magnifying glass marker as search marker 
        const markerIcon = L.icon({
            iconUrl: 'assets/img/map-markers/magnifying-glass.png',
            iconSize: [30, 30],
            iconAnchor: [20, 40], // Point of the icon which will correspond to marker's location
            popupAnchor: [0, -40] // Point from which the popup should open relative to the iconAnchor
        });

        // Loop through each location in the search results
        for (let location of searchResults.results) {
            // Create a marker for each location
            const lat = location.geocodes.main.latitude;
            const lng = location.geocodes.main.longitude;
            const address = location.location.formatted_address;
            const name = location.name;
            const marker = L.marker([lat, lng], { icon: markerIcon });

            // bind 
            marker.bindPopup(function () {
                const divElement = document.createElement('div');
                divElement.innerHTML = `
                <h5>${location.name}</h5>
                <p>${location.location.formatted_address}</p>
            `;

                async function getPicture() {
                    const photos = await getPhotoFromFourSquare(location.fsq_id);
                    const firstPhoto = photos[0];
                    const photoUrl = firstPhoto.prefix + '150x150' + firstPhoto.suffix;
                    divElement.querySelector("img").src = photoUrl;
                }

                getPicture();

                return divElement;
            });

            // Add the marker to the map
            marker.addTo(layer);

            // Create and display the search result
            const divElement = document.createElement('div');
            divElement.innerHTML = location.name;

            // Event listener for clicking a search result
            divElement.addEventListener("click", function () {
                map.flyTo([lat, lng], 16); // Fly to the location
                marker.openPopup(); // Open marker popup
            });

            searchResultOutput.appendChild(divElement);

            // Add mouseover event listener
            marker.on('mouseover', function (event) {
                marker.openPopup(); // Open popup on mouseover
            });
            // Add mouseout event listener
            marker.on('mouseout', function (event) {
                marker.closePopup(); // Close popup on mouseout
            });
        }
    }

    // Function to search for locations using FourSquare API
    async function search(lat, lng, searchTerms) {
        try {
            const response = await axios.get(`${BASE_API_URL}/places/search`, {
                params: {
                    query: encodeURI(searchTerms),
                    ll: lat + "," + lng,
                    sort: "DISTANCE",
                    radius: 3000,
                    limit: 10
                },
                headers: {
                    Accept: "application/json",
                    Authorization: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error searching for locations:", error);
            return [];
        }
    }

    // Function to fetch photos from FourSquare
    async function getPhotoFromFourSquare(fsqId) {
        try {
            const response = await axios.get(`${BASE_API_URL}/places/${fsqId}/photos`, {
                headers: {
                    Accept: "application/json",
                    Authorization: API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching photos:", error);
            return [];
        }
    }
    document.querySelector("#searchBtn").addEventListener("click", async function () {
        const searchTerms = document.querySelector("#searchTerms").value;

        // find the lat lng of the center of the map
        const centerPoint = map.getBounds().getCenter();
        const data = await search(centerPoint.lat, centerPoint.lng, searchTerms);

        // adding markers to the map for the search results
        addMarkersToMap(data, searchLayer, map);

    });


    // --------------------------- Add weather (temperature) information ----------------------------//
    // Function to fetch weather data for a specific location (Open Meteo API)
    async function fetchWeatherData(latitude, longitude) {
        try {
            const response = await axios.get('https://api.open-meteo.com/v1/gfs', {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    hourly: 'temperature_2m', 'time':12,
                    timezone: 'auto'
                }
            });
            console.log(response);
            return response.data;

        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }
    // --------------------------- End of weather (temperature) information ----------------------------//


    // ------------------------------------ Add User's Planned Route ----------------------------------//
    // Leaflet Routing Machine
    // Add customised marker to user's planned route
    let userIcon = new L.Icon({
        iconUrl: 'assets/img/user.png',
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Add Leaflet Routing Machine's routing control 
    const control = L.Routing.control({
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim({
            language: 'en' // Set language to English
        }),
        createMarker: function (i, wp, nWps) {
            if (i === 0 || i === nWps - 1) {
                return L.marker(wp.latLng, {
                    icon: userIcon
                });
            } else {
                // Return error
                return null;
            }
        }
    });
    control.addTo(map);


    // navContainer
    const navContainer = document.getElementById('navContainer');
    const startBtn = document.getElementById('startBtn');
    const destBtn = document.getElementById('destBtn');
    const weatherContainer = document.getElementById('weatherContainer');


    map.on('click', async function (e) {
        // Create popups
        const navPopup = L.popup().setLatLng(e.latlng).setContent(navContainer);
        const weatherPopup = L.popup({
            offset: [0, 180]
        }).setLatLng(e.latlng).setContent(weatherContainer);

        // Clear existing contents of popups
        navContainer.innerHTML = '';
        weatherContainer.innerHTML = '';

        // Append start and destination buttons to the navContainer
        navContainer.appendChild(startBtn);
        navContainer.appendChild(destBtn);

        try {
            // Fetch weather data
            const weatherData = await fetchWeatherData(e.latlng.lat, e.latlng.lng);
            // Set content for weatherContainer based on fetched data
            weatherContainer.innerHTML = `
                <h5>Weather Information</h5>
                <p>Date & Time: ${ weatherData.hourly.time[12]}</p>
                <p>Temperature: ${weatherData.hourly.temperature_2m[12]}°C</p>
            `;
        } catch (error) {
            console.error('An error occurred while fetching weather data:', error);
        }

        // Open popups on the map
        navPopup.addTo(map);
        weatherPopup.addTo(map);

        // Event listeners for start and destination buttons
        L.DomEvent.on(startBtn, 'click', function () {
            control.spliceWaypoints(0, 1, e.latlng);
            map.closePopup();
        });

        L.DomEvent.on(destBtn, 'click', function () {
            control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
            map.closePopup();
        });
    });
    // ------------------------------------ End of User's Planned Route ----------------------------------//
    // Group taxi markers for available taxis in cluster
    let taxiCluster;
    let taxiVisible = false;

    document.getElementById("taxi").addEventListener("click", async function () {
        if (taxiVisible) {
            // If taxi markers are visible, clear them by clearing the taxiCluster layer group
            taxiCluster.clearLayers();
            taxiVisible = false; // Update visibility state
        } else {
            // If taxi markers are hidden, show them by loading and drawing the taxi markers
            const taxiPositions = await loadTaxi();
            if (!taxiCluster) {
                // If taxiCluster doesn't exist, create it and add it to the map
                taxiCluster = L.markerClusterGroup().addTo(map);
            } else {
                // If taxiCluster exists, clear its layers before adding new markers
                taxiCluster.clearLayers();
            }
            drawTaxi(taxiPositions, taxiCluster);
            taxiVisible = true; // Update visibility state
        }
    });

    // redraw taxi markers every 30 seconds
    setInterval(async function () {
        if (taxiVisible) {
            // Only redraw taxi markers if they are visible
            const taxiPositions = await loadTaxi();
            if (!taxiCluster) {
                // If taxiCluster doesn't exist, create it and add it to the map
                taxiCluster = L.markerClusterGroup().addTo(map);
            } else {
                // If taxiCluster exists, clear its layers before adding new markers
                taxiCluster.clearLayers();
            }
            drawTaxi(taxiPositions, taxiCluster);
        }
    }, 30 * 1000);

    async function loadTaxi() {
        // load in all the available taxi using the Taxi Availablity API
        const response = await axios.get("https://api.data.gov.sg/v1/transport/taxi-availability");
        return response.data.features[0].geometry.coordinates;
    }

    function drawTaxi(taxiPositions, taxiCluster) {
        const taxiIcon = L.icon({
            iconUrl: 'assets/img/map-markers/taxi-color.png',
            iconSize: [32, 32], // Size of the icon
            iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
        });

        for (let taxi of taxiPositions) {
            const coordinate = [taxi[1], taxi[0]];
            const marker = L.marker(coordinate, { icon: taxiIcon });

            marker.addTo(taxiCluster);
        }
    }

    const esriSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 18
    })

    const baseLayers = {
        "View Search Only": searchLayer,
        "Venue": venueClusterLayer
    };

    const overlayLayers = {
        "Satellite Layer": esriSatelliteLayer
    };

    L.control.layers(baseLayers, overlayLayers).addTo(map);
    venueClusterLayer.addTo(map);
    // --------------------------------------------- End of Section 2: Event Venue ------------------------------------------//


    // --------------------------------------------------- Section 4: Subscribe ---------------------------------------------//
    document.getElementById("subscribe-btn").addEventListener("click", function () {
        // Add SweetAlert2 alert for subscribe button
        Swal.fire({
            title: "Welcome to the team",
            text: "Stay tuned for more updates!",
            icon: "success"
        });
    });
    // ------------------------------------------- End of Section 4: Subscribe ---------------------------------------------//
});



