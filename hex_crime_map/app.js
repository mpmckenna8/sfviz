import {Deck} from '@deck.gl/core';
import {GeoJsonLayer, ArcLayer} from '@deck.gl/layers';
import d3 from 'd3'

// https://github.com/visgl/deck.gl/blob/master/docs/layers/hexagon-layer.md
import {HexagonLayer} from '@deck.gl/aggregation-layers';

import sfcri2geojson from 'sfcri2geojson'
import mapboxgl from 'mapbox-gl';

var numbRes = 8000;

let base_crime_uri = "https://data.sfgov.org/resource/wg3w-h783.json?"
let crime_uri = "https://data.sfgov.org/resource/wg3w-h783.json?$where=incident_date between '2020-04-01T00:00:00' and '2020-05-01T01:00:00'&$limit=" + numbRes + '&$order=incident_datetime DESC';


let earliest_date = new Date()
let latest_date = new Date();


let max_points = 5;

const INITIAL_VIEW_STATE = {
  latitude: 37.77056523653,
  longitude: -122.410757881825685,
  
  zoom: 11,
  bearing: 0,
  pitch: 30
};

let incident_categories = [];
let incident_category = "All";

let date_filter = "&$where=date between '2020-01-10T12:00:00' and '2020-01-10T14:00:00'" //"&$where=incident_date between " + "2020-4-13T00:00:00.000 and 2020-5-13T00:00:00.000"//new Date('may 4, 2020')

//crime_uri = crime_uri + date_filter;
// $where=date between '2020-01-10T12:00:00' and '2020-01-10T14:00:00'
mapboxgl.accessToken = 'pk.eyJ1IjoibXBtY2tlbm5hOCIsImEiOiJfYWx3RlJZIn0.v-vrWv_t1ytntvWpeePhgQ'; // eslint-disable-line


let geojson_local = {"type":"FeatureCollection","features":[]}

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
   console.log('crime data ', datam)

   geojson_local.features = datam;
  //  let data = sfcri2geojson(datam).geojson;
    //console.log('crime points are: ', crime_points)

    let coords_array = datam.map( d => {

      let coords = [ d.latitude, d.longitude]
      if ( coords[0] ) {
        coords[0] = parseFloat(coords[0]);
      }
      else {
        coords[0] = 1.0;
      }
      if ( coords[1] ) {
        coords[1] = parseFloat(coords[1]);
      }
      else {
        coords[1] = 1.0;
      }
      return [ (coords[1] ) , (coords[0])]
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

    // make legend;
  //  d3.select("#map_legend")

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
              pickable: true,
              colorRange: COLOR_RANGE,
              data:  coords_array,
              elevationDomain: [1, 387],
              colorDomain: [1, 387],
              elevationScale: 9,
              extruded: true,
              radius: 300,
              getColorValue: points => {
                //console.log('color value = ', points.length)
                if( points.length > max_points) {
                  max_points = points.length
                }
                return points.length
              },
              getPosition: d => {
                //console.log('getting postion', d)
                return d
              },
              onHover: ({object, x, y}) => {
               // console.log('object hovered, ', object)
               // const tooltip = `${object.centroid.join(', ')}\nCount: ${object.points.length}`;
                /* Update tooltip
                   http://deck.gl/#/documentation/developer-guide/adding-interactivity?section=example-display-a-tooltip-for-hovered-object
                */
              },
              onSetColorDomain: (ecol) => {
                console.log('color domain set', ecol)
                console.log('max_points: ', max_points)

              },
              opacity: .4

            //  ...options
            }),

    ]
  });

  })

// For automated test cases
/* global document */
document.body.style.margin = '0px';
