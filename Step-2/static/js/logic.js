// Get geoJSON data of earthquakes from the last 7 days
const earthquakeURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
const plateURL = "static/data/PB2002_boundaries.json";

/*===================================================================
========================== MAP CREATION =============================
===================================================================*/

// Create the base layers. We want a greyscale map, satellite map and outdoors map
var greyscale = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/light-v10",
    accessToken: API_KEY
});

var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/satellite-v9",
    accessToken: API_KEY
});

var outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/outdoors-v11",
    accessToken: API_KEY
});

// Create a baseMaps object.
var baseMaps = {
  "Greyscale Map": greyscale,
  "Satellite Map": satellite
};

// Create two new layer groups, one for earthquakes and one for tectonic plates
var earthquakes = L.layerGroup();
var plates = L.layerGroup();

// Create an overlay object to hold our overlays.
var overlayMaps = {
  "Earthquakes": earthquakes,
  "Tectonic Plates": plates
};

// Create our map, giving it the greymap, earthquakes, and plate layers to display on load.
var myMap = L.map("map", {
  center: [
    50, -120
  ],
  zoom: 3,
  layers: [greyscale, earthquakes, plates]
});

// Create a layer control.
// Pass it our baseMaps and overlayMaps.
// Add the layer control to the map.
L.control.layers(baseMaps, overlayMaps, {
  collapsed: false
}).addTo(myMap);

// Create a legend to display info about the map
var legend = L.control({
    position: "bottomright"
  });

  legend.onAdd = function() {
    var div = L.DomUtil.create("div", "legend");
    var labels = ["<strong>Earthquake Magnitude</strong>"]
    var magnitudes = [0, 1, 2, 3, 4, 5];
    var colours = ["#439A1B","#D8DD4B","#EEA12D","#FF6E35","#D03419","#7D0000"];


  // loop thry the intervals of colors to put it in the label
    for (var i = 0; i<magnitudes.length; i++) {
      div.innerHTML +=
      labels.push(
      "<i style='background: " + colours[i] + "'></i> " +
      // Use a question mark operator for true/false condition work
      /* If current list item [i] + next list item [i+1] is true, list them with a hyphen between.
        If it's false (aka end of the list) then add a "+" sign */
      magnitudes[i] + (magnitudes[i + 1] ? "&ndash;" + magnitudes[i + 1] : "+"));
    }
    div.innerHTML = labels.join("<br>");
    return div;

  };

  legend.addTo(myMap);

/*===================================================================
========================== MARKER STYLES ============================
===================================================================*/

// Create a function to style the map markers
function styleMarkers(earthquake) {
    // Return a style object (dict)
    return {
        opacity: 1,
        fillOpacity: 1,
        color: "black", // border colour
        fillColor: markerColour(earthquake.properties.mag), // will run a function to get colour based on magnitude
        radius: markerRadius(earthquake.properties.mag), // will run a  function to get radius size based on magnitude
        weight: 0.5 // sets border weight
    };
}

// Create a function to get marker colours based on earthquake magnitude
function markerColour(magnitude) {
    switch (true) {
        case magnitude > 5:
            return "#7D0000";
        case magnitude > 4:
            return "#D03419";
        case magnitude > 3:
            return "#FF6E35";
        case magnitude > 2:
            return "#EEA12D";
        case magnitude > 1:
            return "#D8DD4B";
        case magnitude >=0:
            return "#439A1B"
    }
}

// Create a function to get marker radius based on magnitude
function markerRadius(magnitude) {
    // If the magnitude is 0, make marker radius 0.5
    if (magnitude === 0) {
        return 0.5;
    }
    // For everything else, multiply the magnitude by 4 to get a bigger radius
    else {
        return magnitude * 4;
    }
}

/*===================================================================
========================== GRABBING DATA ============================
===================================================================*/
// Perform a GET request to the query URL/
d3.json(earthquakeURL).then(earthquakeData => {
    // Console log the earthquake data features object
    // NOTE this is an array of arrays
    console.log(earthquakeData.features);
    // Define a `generatePopup` function that we want to run once for each feature in the features array.
    // Give each feature a popup that describes the place and time of the earthquake, and its magnitude.
    function generatePopup(earthquake, layer) {
        layer.bindPopup(`<h3>${earthquake.properties.place}</h3>
                        <hr>
                        <p>Occured at: ${new Date(earthquake.properties.time)}</p>
                        <p>Magnitude: ${earthquake.properties.mag}</p>`);
    }

    // Create a GeoJSON layer that contains the features array on the earthquakeData object.
    // Run the generatePopup function once for each piece of data in the array.
    L.geoJSON(earthquakeData, {
    // Call the generatePopup function to bind a popup to each feature
    onEachFeature: generatePopup,
    // Convert each earthquake into a circle marker using its coordinates
    pointToLayer: function(earthquake, coords) {
        return L.circleMarker(coords);
    },
    // Style each circle marker by calling our styleMarkers function (don't need a parameter as it was previously defined)
    style: styleMarkers
    })
    // Add this geoJSON layer to the earthquakes layer
    .addTo(earthquakes);
    
    // Add earthquakes layer to the map
    earthquakes.addTo(myMap);
});

// Perform a GET request to the query URL/
d3.json(plateURL).then(plateData => {
  // Console log the earthquake data features object
  // NOTE this is an array of arrays
  console.log(plateData);

  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  L.geoJSON(plateData, {
  // Style each plate line
  color: "orange",
  weight: 2
  })
  // Add this geoJSON layer to the plates layer
  .addTo(plates);
  
  // Add plates layer to the map
  plates.addTo(myMap);
});