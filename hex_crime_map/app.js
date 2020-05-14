import {Deck} from '@deck.gl/core';
import {GeoJsonLayer} from '@deck.gl/layers';
//import d3 from 'd3'

// https://github.com/visgl/deck.gl/blob/master/docs/layers/hexagon-layer.md
import {HexagonLayer} from '@deck.gl/aggregation-layers';

//import sfcri2geojson from 'sfcri2geojson'
import mapboxgl from 'mapbox-gl';


let start_input = document.querySelector('#start_date_input')
start_input.onchange =  start_date_change

let end_input = document.querySelector('#end_date_input')
end_input.onchange =  end_date_change

let max_span = document.querySelector('#max_poly')



let query_parameters = new URLSearchParams( window.location.search );

console.log('query params', query_parameters.values() )


  let uri_obj = {
    base: "https://data.sfgov.org/resource/wg3w-h783.json?",
    res_limit: 25000,
    res_limit_str: "$limit=",
    res_limit_query: function() {
      return (this.res_limit_str + this.res_limit)
    },
    date_start: '2020-01-01T00:00:00',
    date_end: '2020-01-02T01:00:00', 
    date_range_str: function() {
      return "$where=incident_date between '" + this.date_start + "' and '" + this.date_end+ "'"
    },
    make_uri: function() {
      return (this.base + this.res_limit_query() + "&" + this.date_range_str() )
    },

  }

let uri_start = query_parameters.get('start_date')
if(uri_start ) {
  uri_obj.date_start =  uri_start;
  start_input.value = uri_start;
}

let uri_end = query_parameters.get('end_date')
if(uri_end ) {
  uri_obj.date_end =  uri_end;
  end_input.value = uri_end;
}
console.log('usi start', uri_start)

console.log('uri from obj', uri_obj.make_uri() )

// example with date filter:
//let crime_uri = "https://data.sfgov.org/resource/wg3w-h783.json?$where=incident_date between '2020-04-01T00:00:00' and '2020-05-01T01:00:00'&$limit=" + numbRes + '&$order=incident_datetime DESC';



let max_points = 5;

const INITIAL_VIEW_STATE = {
  latitude: 37.77056523653,
  longitude: -122.410757881825685,
  zoom: 11,
  bearing: 0,
  pitch: 30
};


let incident_categories = {};
let incident_category = "All";

let date_filter = "&$where=date between '2020-01-01T12:00:00' and '2020-05-01T14:00:00'" //"&$where=incident_date between " + "2020-4-13T00:00:00.000 and 2020-5-13T00:00:00.000"//new Date('may 4, 2020')

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


let coords_array = [
   {
  analysis_neighborhood: "Tenderloin",
latitude: "37.78175909075511",
longitude: "-122.41468313321063",
police_district: "Tenderloin",
  },  {point: [1.2,2.1], longitude: "2.12", latitude:"32.23" }];
let feats_obj = { coords_array: coords_array }

const COLOR_RANGE = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78]
];

let long_lat = []



function renderCrimez() {

    const crimer = fetch( uri_obj.make_uri() )
      .then((res) => {
        return res.json();
      })
      .then( datam => {
      console.log('crime data ', datam)
      feats_obj.coords_array = datam;

      document.querySelector('#crimes_total').innerHTML = datam.length


        const hexlayer = new HexagonLayer({
          id: 'heatmap',
          pickable: true,
          colorRange: COLOR_RANGE,
          data:  feats_obj.coords_array,
       //   dataComparator: (newD, oldD) => { 
         //   console.log('newD', newD, 'oldD', oldD)
         //   return newD.length === oldD.length },
      //    _dataDiff: (newData, oldData) => [{startRow: index, endRow: index + 1}],
         // elevationDomain: [1, 387],
         // colorDomain: [1, 387],
          elevationScale: 9,
          extruded: true,
          radius: 300,
         getColorValue: points => {
            //console.log('color value = ', points.length)
            if( points.length > max_points) {
              max_points = points.length
            }
            console.log('incident cats, ', incident_categories)
            renderCategories( incident_categories )
            return points.length
          },
          getPosition: d => {
          //  console.log('getting postion', d)
            long_lat = []
            if( d.longitude ) {
              long_lat.push(d.longitude)
            }
            else{
              long_lat.push("2.2")
            }
            if( d.latitude ) {
              long_lat.push(d.latitude)
            }
            else{
              long_lat.push("2.2")
            }   

            if( Object.keys(incident_categories).includes(d.incident_category) ) {

              incident_categories[ d.incident_category ].count =  incident_categories[ d.incident_category ].count + 1
            }
            else {
              incident_categories[ d.incident_category ] = {count: 1}
            }

           // console.log('poistion', [ parseFloat( long_lat[0] ), parseFloat( long_lat[1] ) ] ) 
            return [ parseFloat( long_lat[0] ), parseFloat( long_lat[1] ) ] //d.point//[d[0], d[1] ] //
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
            max_span.innerHTML = ecol[1]
          //  console.log('max_points: ', max_points)
          },
          updateTriggers: {
            // This tells deck.gl to recalculat radius when `currentYear` changes
            getPosition: long_lat,
           // getColorValue:max_points
          },
          opacity: .4
        //  ...options
        })

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
            hexlayer
          ]
        });


        const OPTIONS = ['radius', 'coverage', 'upperPercentile'];

        // make legend;
      //  d3.select("#map_legend")

    })
}
  
renderCrimez()
//update_crime_data();

// For automated test cases
/* global document */
document.body.style.margin = '0px';


document.querySelector('#end_date_input')
.onchange =  end_date_change



function start_date_change(e) {
  //console.log('start date changed', e, this)

  let start_date = e.target.value;
  uri_obj.date_start = start_date;

  query_parameters.set('start_date', start_date)
  
  query_parameters.set('start_date', start_date)

  window.location.search = "?" + query_parameters.toString()
}

function end_date_change(e) {
  //console.log('end date changed', e.target.value, this)

  let end_date = e.target.value;
  uri_obj.date_end = end_date;

  query_parameters.set('end_date', end_date)

  window.location.search = "?" + query_parameters.toString()
}

let cat_list = document.querySelector( "#category_list" )

function renderCategories( incident_categories ) {

  let incident_keys = Object.keys( incident_categories )
  incident_keys = incident_keys.sort( ( a,b ) =>   incident_categories[b].count - incident_categories[a].count )
  
  console.log('incident_keys = ', incident_keys)
  let catHTML = "<tbody>"

  for( let incident of incident_keys) {
    catHTML = catHTML + "<tr><td>" + incident + "</td><td>" + incident_categories[incident].count + "</td></tr>"
  }
  catHTML = catHTML + "</tbody>"
  cat_list.innerHTML = catHTML;
}
