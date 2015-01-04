var pg = require('pg-query');
var config = require('../config');

pg.connectionParameters = config.pgConnection;

var tableName = 'ais5';
var error_response = "data already exists - bypassing db initialization step\n";

exports.init = function(){

    pg('CREATE EXTENSION postgis;', createDBSchema);
    //promise.then(createDBSchema);
    //promise.then(addSpatialIndex);
};

function createDBSchema(err, rows, result) {
    console.log('err? ' + JSON.stringify(err));
    console.log('called createDBSchema');
    if(err && err.code == "ECONNREFUSED"){
        return console.error("DB connection unavailable, see README notes for setup assistance\n", err);
    }
    //var query = "CREATE TABLE "+tableName+" ( gid serial NOT NULL, name character varying(240), geom geometry, CONSTRAINT "+tableName+ "_pkey PRIMARY KEY (gid), CONSTRAINT enforce_dims_geom CHECK (st_ndims(the_geom) = 2), CONSTRAINT enforce_geotype_geom CHECK (geometrytype(the_geom) = 'POINT'::text OR the_geom IS NULL),CONSTRAINT enforce_srid_geom CHECK (st_srid(the_geom) = 4326) ) WITH ( OIDS=FALSE );";


    var query = "CREATE TABLE IF NOT EXISTS "+tableName+" ( gid serial NOT NULL, type character varying(240), mmsi numeric, geom geometry, create_timestamp timestamp with time zone, CONSTRAINT "+tableName+ "_pkey PRIMARY KEY (gid), CONSTRAINT enforce_dims_geom CHECK (st_ndims(geom) = 2), CONSTRAINT enforce_geotype_geom CHECK (geometrytype(geom) = 'POINT'::text OR geom IS NULL),CONSTRAINT enforce_srid_geom CHECK (st_srid(geom) = 4326) ) WITH ( OIDS=FALSE );";

    pg(query, addSpatialIndex);
}

function addSpatialIndex(err, rows, result) {
    if(err) {
        return console.error(error_response, err);
    }
    console.log('result', result);
    pg("CREATE INDEX "+tableName+"_geom_gist ON "+tableName+" USING gist (geom);", function(err, rows, result) {
        if(err){
            console.log('addSpatial err', err);
        } else {
            console.log('addSpatial result', result);
        }
    });
}

exports.getStations = function(req, res){
    pg('SELECT name, ST_X(ST_Transform(geom, 4326)) as lon, ST_Y(ST_Transform(geom, 4326)) as lat FROM nyc_subway_stations;', function(err, rows, result) {
        if(err) {
            res.send(500, {http_status:500,error_msg: err})
            return console.error('error running query', err);
        }
        res.send(rows);
        return rows;
    });
};

exports.insertPoint = function(args){
    var query = "Insert into "+tableName+" (type, mmsi, geom, create_timestamp) VALUES ('" + args.type + "', " + args.mmsi + ", ST_GeomFromText('POINT(" + args.lon + " " + args.lat + " )', 4326), '" + new Date().toISOString() + "');";
    //var qpoints = points.map(insertMapPinSQL).join(",");
    //var query = insert + qpoints + ';';
    console.log(query);
    pg(query, function(err, rows, result) {
        if(err) {
            return console.error(error_response, err);
        }
        var response = 'Data import completed!';
        return response;
    });
};

exports.getRoutes = function(req, res){
    //var query = "SELECT ST_AsGeoJSON(the_points)::json geometry FROM (SELECT ST_MakeLine(geom) AS the_points FROM " + tableName + " GROUP BY mmsi) AS the_points limit 1;";
    var query = "SELECT 'Feature' as type, ST_AsGeoJSON(the_points)::json geometry, '{}' as properties FROM (SELECT ST_MakeLine(geom) AS the_points FROM " + tableName + " GROUP BY mmsi) AS the_points;";

    pg(query, function(err, rows, result){
        if(err){
            return console.error(err);
        }
        console.log(JSON.stringify(result));
        res.send(rows);
    })
}
