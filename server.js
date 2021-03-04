
var sqlite3 = require('sqlite3');
var http = require('http');
var querystring = require('querystring');
var url = require('url');

var sqlite_fname = "student_data.sqlite3"
let db = new sqlite3.Database(sqlite_fname, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});


var server = http.createServer(function (request, response) {

    var path = request.url.split('/')[1]
    console.log(path);
    if (path.startsWith("search")) {
        console.log("search path", request.url, request.method);
        handleSearch(request, response);
    } else if (path.startsWith("student")) {
        handleStudent(request, response);
    } else if (path.startsWith('createstudent')) {
        studentForm(request, response);
    } else if (path.startsWith('formsearch')) {
        searchForm(request, response);
    } else {
        response.writeHead(404, { "Content-Type": "text\plain" });
        response.end("Undefined request.");
    }
});

function studentForm(request, response) {
    if (request.method == "GET") {
        response.writeHead(200, { "Content-Type": "text\plain" });
        response.end(`<html>
                    <body>
                        <form method="POST" action="/student">
                            <label for="name">Name:</label><input type="text" name="name"><br/>
                            <label for="name">Class:</label><input type="text" name="class"><br/>
                            <label for="name">Class Time:</label><input type="text" name="class_time"><br/>
                            <input type="submit"/>
                        </form>
                    </body>
                </html>`);
    }
}

function searchForm(request, response) {
    console.log(request, response);
    if (request.method == "GET") {
        response.writeHead(200, { "Content-Type": "text\plain" });
        response.end(`<html>
                    <body>
                        <form method="GET" action="/search">
                            <label for="name">Name:</label><input type="text" name="name"><br/>
                            <input type="submit"/>
                        </form>
                    </body>
                </html>`);
    }
}

//STUDENT: Create a new GET handler that will make a delete form


//STUDENT: Create a new POST handler that will delete a student from the database


function handleStudent(request, response) {
    if (request.method == "POST") {
        let form_data = "";
        request.on('data', (chunk) => {
            form_data += chunk.toString();
        });
        request.on('end', () => {
            var data = querystring.parse(form_data);
            console.log(form_data, data);
            if (!data['class'] || !data['name'] || !data['class_time']) {
                response.writeHead(400);
                response.end('missing required form fields');
            } else {
                let sql = "insert into student(name, class, class_time) values ($name, $class, $class_time)";
                var params = {
                    $name: data['name'],
                    $class: data['class'],
                    $class_time: data['class_time']
                }

                db.run(sql, params, (err) => {
                    if (err) {
                        throw err;
                    }
                    response.writeHead(200);
                    response.end("insert successful");
                });
            }
        });
    }
}


function handleSearch(request, response) {
    if (request.method != 'GET') {
        response.writeHead(400, { "Content-Type": "text\plain" });
        response.end("Undefined request.");
    }
    const url = new URL(request.url, 'http://localhost:8000');
    // Parse the URL query. The leading '?' has to be removed before this.
    const queryObject = querystring.parse(url.search.substr(1));

    console.log(queryObject);

    if (!queryObject['name']) {
        nameQuery = '';
    } else {
        nameQuery = queryObject['name'];
    }

    let sql = "SELECT DISTINCT name FROM student where name like $like_query ORDER BY name";
    //let sql = "SELECT DISTINCT name FROM student where name like '%" + nameQuery + "%' ORDER BY name";
    var params = {
        $like_query: `${nameQuery}%`
    };
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.log(err);
            response.writeHead(500, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
            response.end("error executing query");
        }
        var searchResults = [];
        if (rows) {
            rows.forEach((row) => {
                searchResults.push({
                    'name': row.name
                });
            });
        }
        var data_str = JSON.stringify(searchResults);
        response.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        response.end(data_str);
    });
}

server.listen(8000);
console.log("Server running on port 8000");
