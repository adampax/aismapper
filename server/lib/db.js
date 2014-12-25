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