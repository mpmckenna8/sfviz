import {Deck} from '@deck.gl/core';
import {GeoJsonLayer, ArcLayer} from '@deck.gl/layers';
import {HexagonLayer} from '@deck.gl/aggregation-layers';
import sfcri2geojson from 'sfcri2geojson'
import mapboxgl from 'mapbox-gl';

var numbRes = 3000;


let crime_uri = "https://data.sfgov.org/resource/wg3w-h783.json?$limit=" + numbRes + '&$order=incident_datetime DESC';



const INITIAL_VIEW_STATE = {
  latitude: 37.79056523653,
  longitude: -122.44857881825685,
  zoom: 8,
  bearing: 0,
  pitch: 30
};


mapboxgl.accessToken = 'pk.eyJ1IjoibXBtY2tlbm5hOCIsImEiOiJfYWx3RlJZIn0.v-vrWv_t1ytntvWpeePhgQ'; // eslint-disable-line




const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  // Note: deck.gl will be in charge of interaction and event handling
  interactive: false,
  center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
  zoom: INITIAL_VIEW_STATE.zoom,
  bearing: INITIAL_VIEW_STATE.bearing,
  pitch: INITIAL_VIEW_STATE.pitch
});



export const crimer = fetch(crime_uri)
  .then((res) => {
    return res.json();
  })
  .then( datam => {
  //  console.log('crime data ', data)
    let data = sfcri2geojson(JSON.stringify(datam)).geojson;
    //console.log('crime points are: ', crime_points)

    let coords_array = data.features.map( d => {

      let coords = d.geometry.coordinates
      return [ parseFloat(coords[1] ) , parseFloat(coords[0])]
    });

    console.log(coords_array)

    const COLOR_RANGE = [
      [1, 152, 189],
      [73, 227, 206],
      [216, 254, 181],
      [254, 237, 177],
      [254, 173, 84],
      [209, 55, 78]
    ];

    const OPTIONS = ['radius', 'coverage', 'upperPercentile'];


  const deck = new Deck({
    canvas: 'deck-canvas',
    width: '100%',
    height: '100%',
    initialViewState: INITIAL_VIEW_STATE,
    controller: true,
    onViewStateChange: ({viewState}) => {
      map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch
      });
    },
  layers: [
      new HexagonLayer({
              id: 'heatmap',
          //    colorRange: COLOR_RANGE,
              data:coords_array,
          //    elevationRange: [0, 1000],
              elevationScale: 10,
              extruded: true,
              radius: 400,
              getPosition: d => {
                //console.log('getting postion', d)
                return d
              },
              opacity: .4

          //    ...options
            }),

    ]
  });

  })

// For automated test cases
/* global document */
document.body.style.margin = '0px';
