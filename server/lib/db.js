var pg = require('pg-query');

pg.connectionParameters = 'postgres://adam:@localhost:5432/nyc';

exports.init = function(){
    //var promise = pg('CREATE EXTENSION postgis;');


   // var query = require('pg-query');
    //query.connectionParameters = 'postgres://user:password@host:5432/database';

//accepts optional array of values as 2nd parameter for parameterized queries
    pg('SELECT name, ST_AsText(geom) FROM geometries;', function(err, rows, result) {
        console.log('err  ' + JSON.stringify(err));
        console.log(JSON.stringify(result));
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
}