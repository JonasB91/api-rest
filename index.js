let express = require("express"); 
let app = express();
app.listen(3000);
console.log("Servern körs på port 3000");

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const mysql = require("mysql"); 
con = mysql.createConnection({
  host: "localhost", 
  user: "root", 
  password: "", 
  database: "gästbokjensen2023", // Bytt till min databas gästbokjensen2023 
  multipleStatements: true, 
});

app.use(express.json()); 
const COLUMNS = ["id", "username", "password", "name", "email"]; 

// grundläggande exempel - returnera en databastabell som JSON
app.get("/users", function (req, res) {
  let sql = "SELECT * FROM users"; 
  let condition = createCondition(req.query); 
  console.log(sql + condition); 
  con.query(sql + condition, function (err, result, fields) {
    res.send(result);
  });
});

let createCondition = function (query) {
 
  console.log(query);
  let output = " WHERE ";
  for (let key in query) {
    if (COLUMNS.includes(key)) {
      
      output += `${key}="${query[key]}" OR `; 
    }
  }
  if (output.length == 7) {
    
    return ""; 
  } else {
    return output.substring(0, output.length - 4); 
  }
};

// route-parameter, dvs. filtrera efter ID i URL:en
app.get("/users/:id", function (req, res) {
  // Värdet på id ligger i req.params
  let sql = "SELECT * FROM users WHERE id=" + req.params.id;
  console.log(sql);
  // skicka query till databasen
  con.query(sql, function (err, result, fields) {
    if (result.length > 0) {
      res.send(result);
    } else {
      res.sendStatus(404); // 404=not found
    }
  });
});


//POST METHOD
app.post("/users", function (req, res) {
  // kod för att validera input
  if (!req.body.username) {
    res.status(400).send("username required!");
    return; // avslutar metoden
  }
  let fields = ["username", "password", "name", "email"]; 
  for (let key in req.body) {
    if (!fields.includes(key)) {
      res.status(400).send("Unknown field: " + key);
      return; // avslutar metoden
    }
  }
  // kod för att hantera anrop
  let sql = `INSERT INTO users (username, password, name, email)
    VALUES ('${req.body.username}', 
    '${req.body.password}',
    '${req.body.name}',
    '${req.body.email}');
    SELECT LAST_INSERT_ID();`; 
  console.log(sql);

  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    // kod för att hantera retur av data
    console.log(result);
    let output = {
      id: result[0].insertId,
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      email: req.body.email,
    };
    res.send(output);
  });
});

//PUT request för att ändra befintlig user 
app.put("/users/:id", function (req, res) {
  //kod här för att hantera anrop…
  // kolla först att all data som ska finnas finns i request-body
  if (!(req.body && req.body.name && req.body.email && req.body.password)) {
    // om data saknas i body
    res.sendStatus(400);
    return;
  }
  let sql = `UPDATE users 
        SET name = '${req.body.name}', email = '${req.body.email}', password = '${req.body.password}'
        WHERE id = ${req.params.id}`;

  con.query(sql, function (err, result, fields) {
    if (err) {
      throw err;
      //kod här för felhantering, skicka felmeddelande osv.
    } else {
      // meddela klienten att request har processats OK
      res.sendStatus(200);
    }
  });
});