
document.addEventListener("DOMContentLoaded", async function () {

    document.getElementById("play-button").addEventListener("click", function () {
        // Display the modal
        document.getElementById("play-button-modal").style.display = "block";
    });

    document.getElementById("subscribe-btn").addEventListener("click", function () {
        Swal.fire({
            title: "Welcome to the team",
            text: "Stay tuned for more updates!",
            icon: "success"
          });
    });

    

    // Close the modal when the close button is clicked
    document.getElementsByClassName("close")[0].addEventListener("click", function () {
        document.getElementById("play-button-modal").style.display = "none";
    });


    // Close the modal when clicking outside of it
    window.addEventListener("click", function (event) {
        if (event.target == document.getElementById("modal")) {
            document.getElementById("play-button-modal").style.display = "none";
        }
    });

    // Get the side pane element
    const sidePane = document.getElementById('side-pane');

    // Get the top offset of the content section where you want the side pane to hide
    const hideOffset = document.getElementById('venue').offsetTop;

    // Add event listener to window scroll event
    window.addEventListener('scroll', function () {
        // Check if the scroll position is past the hideOffset
        if (window.scrollY >= hideOffset) {
            // Hide the side pane
            sidePane.style.display = 'none';
        } else {
            // Show the side pane
            sidePane.style.display = 'block';
        }
    });

    // modal button
    // Hide modal button when modal is shown
    // document.getElementById('staticBackdrop').addEventListener('shown.bs.modal', function () {
    //     document.getElementById('modal-button').style.display = 'none';
    // });


    // Show modal button when modal is hidden
    document.getElementById('staticBackdrop').addEventListener('hidden.bs.modal', function () {
        document.getElementById('modal-button').style.display = 'block';
    });


    // setup the map
    const map = L.map('map').setView([1.3521, 103.8198], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);

    // Define searchLayer as a layer group
    const searchLayer = L.layerGroup();
    searchLayer.addTo(map);

    // Create marker cluster group
    const venueClusterLayer = L.markerClusterGroup({
        iconCreateFunction: function (cluster) {
            const childCount = cluster.getChildCount();

            return L.divIcon({
                html: `<div class="venue-cluster-icon"><img src="assets/img/map-markers/microphone.png">${childCount}</div>`,
                className: 'venue-cluster',

                iconSize: L.point(100, 100)
            });
        }
    });
    venueClusterLayer.addTo(map);

    const venueResponse = await axios.get('assets/data/venue.geojson');
    for (let venue of venueResponse.data.features) {
        let reversedCoordinates = [venue.geometry.coordinates[1], venue.geometry.coordinates[0]]; // Reverse coordinates

        const venueIcon = L.icon({
            iconUrl: 'assets/img/map-markers/microphone-zoom.png',
            iconSize: [40, 40], // Size of the icon
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

    // // Event Brite API
    // const API_KEY = 'SJCOUGP4LMDOBEPTVRMH'; 
    // const BASE_API_URL = "https://www.eventbriteapi.com/v3/";

    // Create marker cluster group for other venues
    // const otherClusterLayer = L.markerClusterGroup({
    //     iconCreateFunction: function(cluster) {
    //         const childCount = cluster.getChildCount();
    //         return L.divIcon({
    //             html: `<div class="other-cluster-icon"><img src="assets/img/map-markers/microphone_others.png">${childCount}</div>`,
    //             className: 'event-cluster',
    //             iconSize: L.point(40, 40)
    //         });
    //     }
    // });
    // otherClusterLayer.addTo(map);

    // Foursquare API
    const BASE_API_URL = "https://api.foursquare.com/v3";
    const API_KEY = "fsq3wvnLGd2aP9AqDQAVE8JuRvhzlab05d3vi2sdPjueMNE="

    //Add markers to a map

    async function addMarkersToMap(searchResults, layer, map) {
        // Remove all existing markers from the provided layer
        layer.clearLayers();

        const searchResultOutput = document.querySelector("#search-results");
        searchResultOutput.innerHTML = "";

        const markerIcon = L.icon({
            iconUrl: 'assets/img/map-markers/magnifying-glass.png', // Path to your new marker icon image
            iconSize: [30, 30], // Size of the icon
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

            marker.bindPopup(function () {
                const divElement = document.createElement('div');
                divElement.innerHTML = `
                <h5>${location.name}</h5>
                <img src="#"/>
                <p>${location.location.formatted_address}</p>
            `;
                // <button class="btn btn-primary clickButton">Click</button> //

                async function getPicture() {
                    const photos = await getPhotoFromFourSquare(location.fsq_id);
                    const firstPhoto = photos[0];
                    const photoUrl = firstPhoto.prefix + '150x150' + firstPhoto.suffix;
                    divElement.querySelector("img").src = photoUrl;
                }

                getPicture();

                // divElement.querySelector(".clickButton").addEventListener("click", function () {
                //             alert("Search stadium!");
                // });

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

    
    // 2. Weather 
    // Function to fetch weather data for a specific location (Open Meteo API)
    async function fetchWeatherData(latitude, longitude) {
        try {
            const response = await axios.get('https://api.open-meteo.com/v1/gfs', {
                params: {
                    latitude: latitude,
                    longitude: longitude,
                    hourly: 'temperature_2m',
                    timezone: 'auto'
                }
            });
            return response.data;

        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }

    // Leaflet Routing Machine
    // Define control variable for Leaflet Routing Machine
    let userIcon = new L.Icon({
        iconUrl: 'assets/img/user.png',
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

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
                return L.marker(wp.latLng, {
                    icon: myViaIcon
                });
            }
        }
    });
    control.addTo(map);

    // navContainer - Get references to HTML elements 
    const navContainer = document.getElementById('navContainer');
    const startBtn = document.getElementById('startBtn');
    const destBtn = document.getElementById('destBtn');
    const weatherContainer = document.getElementById('weatherContainer');

    // navContainer
    map.on('click', function (e) {
        taxiCluster.clearLayers();
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

        // Append weather container to the weatherContainer
        fetchWeatherData(e.latlng.lat, e.latlng.lng)
            .then(weatherData => {
                weatherContainer.innerHTML = `
                    <h4>Weather Information</h4>
                    <h5>Temperature: ${weatherData.hourly.temperature_2m[0]}°C</h5>
                `;
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
            });

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

    // redraw every 30 seconds
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


    // const overlayLayer = L.tileLayer('https://example.com/{z}/{x}/{y}.png', {
    //     attribution: 'Your attribution here'
    // }).addTo(map);

    const baseLayers = {
        "Venue": venueClusterLayer,
        "View Search Only": searchLayer
    };

    // const overlayLayers = {
    //     "Overlay Layer": overlayLayer
    // };

    L.control.layers(baseLayers).addTo(map);
});


async function loadTaxi() {
    // load in all the available taxi using the Taxi Availablity API
    const response = await axios.get("https://api.data.gov.sg/v1/transport/taxi-availability");
    return response.data.features[0].geometry.coordinates;
}

function drawTaxi(taxiPositions, taxiCluster) {
    const taxiIcon = L.icon({
        iconUrl: 'assets/img/map-markers/taxi.png',
        iconSize: [32, 32], // Size of the icon
        iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
    });


    for (let taxi of taxiPositions) {
        const coordinate = [taxi[1], taxi[0]];
        const marker = L.marker(coordinate, { icon: taxiIcon });

        marker.addTo(taxiCluster);
    }
}


