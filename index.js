const https = require('https')
var fs = require("fs");

//helpers for files manipulation
var fsquery = {
		
	// https://stackoverflow.com/questions/31978347/fs-writefile-in-a-promise-asynchronous-synchronous-stuff
	write: function (filename, data) {
		return new Promise(function(resolve, reject) {
			fs.writeFile(filename, data, 'UTF-8', function(err) {
				if (err) reject(err);
				else resolve(data);
			});
		});
	},
	
	// https://stackoverflow.com/questions/34628305/using-promises-with-fs-readfile-in-a-loop
	read: function(filename) {
		return new Promise(function(resolve, reject) {
			fs.readFile(filename, 'UTF-8', function(err, data){
				if (err) 
					reject(err); 
				else 
					resolve(data);
			});
		});
	},
	
	// https://stackoverflow.com/questions/4482686/check-synchronously-if-file-directory-exists-in-node-js
	fileExists: function(filename) {
		try
		{
			return fs.statSync(filename).isFile();
		}
		catch (err)
		{
			if (err.code == 'ENOENT') { // no such file or directory. File really does not exist
			  console.log("File does not exist.");
			  return false;
			}
			return false; // something else went wrong, we don't have rights, ...
		}
	}
};
	
	
//helpers for http requests
var httpquery = {
	
	getHttp: function(file) {
		return httpquery.request(file.host, file.path, "html");
	},
	
	getFile: function(file) {
		let type = file.type ? file.type : "json";
		return httpquery.request(file.host, file.path, type, undefined, "GET");
	},
	
	get: function(host, path) {
		return httpquery.request(host, path, "json", undefined, "GET");
	},
	
	postJson: function(host, path, object) {
		return httpquery.request(host, path, "json", object, 'POST');
	},
	
	put: function(host, path, object) {
		return httpquery.request(host, path, null, object, "PUT");
	},
	
	patch: function(host, path, object) {
		return httpquery.request(host, path, "json", object, "PATCH");
	},
	
	downloadFile : function(host, path, outputFile) {
		return new Promise((resolve, reject) => {
			var options = {
				host: host,
				port: 443,
				path: path
			};
		
			var file = fs.createWriteStream(outputFile);
			https.get(options, function(res) {
			res.on('data', function(data) {
				file.write(data);
			}).on('end', function() {
				file.end();
				resolve(outputFile);
			});
			}).on('error', function(e) {
				console.log("Got error: " + e.message);
				reject(e);
			});
		});
	},

	request: function(host, path, kind, object, method) {
		return new Promise((resolve, reject) => {
			
			var data = undefined; 
			if (object != undefined) {
				data = JSON.stringify(object);
			}
			var options = {
				host: host,
				port: 443,
				path: path,
				method: method,
				headers: { }
			};
			if (data != undefined) {
				options.headers['Content-Type'] = 'application/json';
				options.headers['Content-Length'] = Buffer.byteLength(data);
			}
			
			if (httpquery.user) {
				options.headers["User-Agent"] = httpquery.user;
			}
			if (httpquery.password) {
				options.headers["Authorization"] = "Basic "+Buffer.from(httpquery.user+":"+httpquery.password).toString("base64");
			}
			
			console.log(options);
			var req = https.request(options, function(res) {
			    let body = '';
			    res.on('data', function(chunk) {
			    	body += chunk;
			    });
			    res.on('end', function() {
					//console.log(JSON.stringify(res.headers, null, " "));
					if (kind == "json") {
						result = JSON.parse(body);
					} else {
						result = body;
					}
					resolve(result);
			    });
				
			}).on('error', function(e) {
				console.log("Got error: " + e.message);
				reject(e);
			});

			if (data != undefined) {
				req.write(data);
			}
			req.end();
		});
	}
};


const concat = (x,y) => x.concat(y)

var github = {

	//Create a new milestone on the configured repository
	postComment: function(pr, text) {
		let message = {
			"body": text
		};

		return new Promise((resolve, reject) => {
			httpquery.postJson("api.github.com", `/repos/${github.config.repository}/issues/${pr}/comments`, message).then(ee => {
				resolve(ee);
			}).catch(ee => {
				reject(ee);
			});
		});
	},
	
	//Get all existing milestones from the configured repository
	getPullRequest: function(pr) {
		return new Promise((resolve, reject) => {
			httpquery.get("api.github.com", `/repos/${github.config.repository}/pulls/${pr}`).then(ee => {
				resolve(ee);
			}).catch(ee2 => {
				reject(ee);
			});
		});
	}
}



//Load configuration and proceed
console.log(JSON.stringify(process.env, null, " "));

if (process.env.USER && process.env.PASSWORD) {
	proceed({ user: process.env.USER, password: process.env.PASSWORD, "repository": "eclipse/capella" });

} else {
	fsquery.read("config.json").then(e => proceed(JSON.parse(e))).catch(e => { console.log(e); });
}

function proceed(config) {
	console.log(JSON.stringify(process.env, null, " "));

	httpquery.user = config.user;
	httpquery.password = config.password;

	github.config = config;
	github.getPullRequest(53).then(miles => {
		console.log(JSON.stringify(miles, null, " "));
		
		github.postComment(53, "This looks ok, no?").then(miles2 => {
			console.log(JSON.stringify(miles2, null, " "));
		
		}).catch(error => {
			console.log(error);
		});

	}).catch(error => {
		console.log(error);
	});

};

