const mysql = require('mysql2');

let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

/* -------------------------------------------------- Credentials --------------------------------------------------*/

exports.login = (req, res) => {
  console.log("loaded signin");
  res.render('login', {layout: 'credential.hbs'});
}
exports.register = (req, res) => {
  console.log("loaded signup");
  res.render('register', {layout: 'credential.hbs'});
}
exports.forgot = (req, res) => {
  console.log("loaded forgotten");
  res.render('forgot', {layout: 'credential.hbs'});
}
exports.reset = (req, res) => {
  console.log("loaded resetting");
  res.render('reset', {layout: 'credential.hbs'});
}
/* ----------------------------------------- Controllers for Credentials -----------------------------------------*/

exports.signin = (req, res) => {
  console.log("Entered signin controller");

  const { email, password } = req.body;
  connection.query("SELECT emp_id FROM account WHERE email = '" + email + "' and password = '" + password + "'", (err, results) => {
    if(results != ""){
      console.log("signin -> sql success");
      req.session.myVisa = results;
      res.redirect('user');
    }
    else{
      console.log("signin -> sql failed");
      res.render("login", {layout: 'credential.hbs', alert: 'Email/Password is incorrect.' });
    }
  });
}

exports.signup = (req, res) => {
  console.log("Entered signup controller");

  const { firstName, lastName, email, password, contact, emp_id } = req.body;

  var sql = "INSERT INTO `account`(`firstName`,`lastName`,`email`,`password`, `contact`, `emp_id`) VALUES ('" + firstName + "','" + lastName + "','" + email + "','" + password + "','" + contact + "','" + emp_id + "')";

  connection.query(sql, (err, result) => {
    if (!err) {
      console.log("signup -> sql success");
      res.render('register', {layout: 'credential.hbs', alert1: "Account has been created."});
    }else{
      console.log("signup -> sql failed");
      res.render('register', {layout: 'credential.hbs', alert: "Account not created."});
    }
  });
}

exports.forgotten = (req, res) => {
  console.log("Entered forgotten controller");

  const { email, numberPhone } = req.body;
  connection.query("SELECT emp_id FROM account WHERE email = '" + email + "' and contact = '" + numberPhone + "'", (err, results) => {
    if(results != ""){
      console.log("forgotten -> sql success");
      req.session.myVisa = results;
      res.render('reset', {layout: 'credential.hbs'});
    }
    else{
      console.log("forgotten -> sql failed");
      res.render("forgot", {layout: 'credential.hbs', alert: 'Email/Phone Number is incorrect.' });
    }
  });
}
exports.resetting = (req, res) => {
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }
  console.log("Entered resetting controller");

  const { email, password } = req.body;
  connection.query("INSERT INTO account SET password = ? WHERE emp_id = '"+req.session.myVisa[0].emp_id+"';",[password], (err, rows) => {
    if(!err){
      console.log("resetting -> sql success");
      res.render('login', {layout: 'credential.hbs', alert1: "Password has been reset"});
      req.session.myVisa = null;
    }
    else{
      console.log("resetting -> sql failed");
      res.render("login", {layout: 'credential.hbs', alert: 'Password has not been reset' });
    }
  });
}

/* -------------------------------------------------- View Users --------------------------------------------------*/

exports.view_user = (req, res) => {
  console.log("User Page");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  let sql = "SELECT * FROM account WHERE emp_id = '"+req.session.myVisa[0].emp_id+"';";

  connection.query(sql, (err, res1) => {
    if (!err) {
      res.render('user', { res1 });
    }else{
      console.log(err);
    }
  });
}


/* -------------------------------------------------- View Dashboard --------------------------------------------------*/
exports.view_dashboard = (req, res) => {
  console.log("Dashboard Page");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  let sql1 = 'SELECT *, (select sum(daySales) from salesandprofit where product_id=salesandprofit.productID) as stockout, (stock_in-(select sum(daySales) from salesandprofit where product_id=salesandprofit.productID)) as availablestock FROM inventory LEFT JOIN salesandprofit ON inventory.product_id=salesandprofit.productID WHERE status = "active" AND daySales>=0 group by product_id ORDER BY availablestock ASC LIMIT 12;';
  let sql2 = 'select productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id where date=CURRENT_DATE group by salesandprofit.productID order by quantity asc limit 4;'; //lowest value
  let sql3 = 'select productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id where date=CURRENT_DATE group by salesandprofit.productID order by quantity desc limit 4;'; //highest value
  let sql5 = 'SELECT product_name FROM inventory LEFT JOIN salesandprofit ON inventory.product_id=salesandprofit.productID WHERE ISNULL(daySales) group by product_id LIMIT 4;'; //no value
  let sql4 = 'select DATE_FORMAT(CURRENT_DATE, "%a-%b %d, %Y") as datenow, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id where date=CURRENT_DATE;';

  let sql = sql1+sql2+sql3+sql4+sql5;
  
  connection.query(sql, (err, [res1, res2, res3, res4, res5]) => {
    if (!err) {

      let a= res2.reverse(); if(JSON.stringify(a)==JSON.stringify(res3)){res2=null;} else {res2.reverse()};

      res.render('dashboard', {
        data1: res1,
        data2: res2,
        data3: res3,
        data4: res4,
        data5: res5
      });
    }
    else{
      console.log(err);
    }
  });
}

/* -------------------------------------------------- View Inventory --------------------------------------------------*/
exports.view_inventory = (req, res) => {
  console.log("Inventory Page");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  if(req.query.page){
    //  Paging process
    let paging = false; //starting point of paging
    let resultsPerPage = 14; //max number of results
    let pagenumber = req.query.page; //get page number from query
    let pageUp = pagenumber-1+2; //Page up
    let pageDown = pagenumber-1; //Page down
    let page = (pagenumber - 1)*resultsPerPage; //Page Limiter formula
    //  End of Paging

    //let sql1='SELECT * FROM inventory WHERE status = "active" LIMIT '+resultsPerPage+' OFFSET '+page+';';
    //let sql1='select *, sum(daySales) as stockout, (stock_in-sum(daySales)) as availability from inventory left outer join salesandprofit on inventory.product_id=salesandprofit.productID WHERE status = "active" group by salesandprofit.productID LIMIT '+resultsPerPage+' OFFSET '+page+';';
    let sql1='SELECT *, (select sum(daySales) from salesandprofit where product_id=salesandprofit.productID) as stockout, (stock_in-(select sum(daySales) from salesandprofit where product_id=salesandprofit.productID)) as availablestock FROM inventory LEFT JOIN salesandprofit ON inventory.product_id=salesandprofit.productID WHERE status = "active" group by product_id LIMIT '+resultsPerPage+' OFFSET '+page+';'
    let sql2='SELECT COUNT(*) as counter FROM inventory WHERE status = "active"';
    let sql=sql1+sql2;

    connection.query(sql, [pagenumber], (err, [rows, numOfResults]) => {
      if (!err) {
        //display Paging Buttons
        let maxPageReached, leastPageReached, maxPage; //Page Limitters
        maxPage = Math.ceil(numOfResults[0].counter/resultsPerPage);//max number of pages
        if(maxPage == pagenumber) maxPageReached = true;
        if(pagenumber == 1) leastPageReached = true;

        res.render('inventory', { rows, pageUp, pageDown, paging, page, maxPageReached, leastPageReached });
      } else {
        console.log("this is error");
      }
    });
  }else{
    connection.query('SELECT * FROM inventory WHERE status = "active" LIMIT 14;', (err, rows) => {
      if (!err) {
        let paging = true;
        res.render('inventory', { rows, paging });
      } else {
        console.log(err);
      }
    });
  }
}
/*
exports.page_inventory = (req, res) => {
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }
  console.log("igot in")

  let resultsPerPage = 2;
  let pagenumber = req.query.page;
  maxPage = Math.ceil(numOfResults/resultsPerPage);//max number of pages
  let page = (pagenumber - 1)*resultsPerPage;
  connection.query('SELECT * FROM inventory WHERE status = "active" LIMIT '+resultsPerPage+' OFFSET '+page+';', [pagenumber], (err, rows) => {
    if (!err) {
      console.log("success paging this")
      res.render('inventory', { rows });
    } else {
      console.log(err);
    }
  });
}
*/

/* -------------------------------------------------- View Archive --------------------------------------------------*/
exports.archiveOpen  = (req, res) => {
  console.log("Archive Page");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  let paging = false; //starting point of paging
  let resultsPerPage = 14; //max number of results
  //get page number from query
  let pagenumber = req.query.page;
  //Page up and down
  let pageUp = pagenumber-1+2;
  let pageDown = pagenumber-1;
  let page = (pagenumber - 1)*resultsPerPage;

  let sql1='SELECT *, (select sum(daySales) from salesandprofit where product_id=salesandprofit.productID) as stockout, (stock_in-(select sum(daySales) from salesandprofit where product_id=salesandprofit.productID)) as availablestock FROM inventory LEFT JOIN salesandprofit ON inventory.product_id=salesandprofit.productID WHERE status = "inactive" group by product_id LIMIT '+resultsPerPage+' OFFSET '+page+';';
  let sql2='SELECT COUNT(*) as counter FROM inventory WHERE status = "inactive"';
  let sql=sql1+sql2;

  connection.query(sql, [pagenumber], (err, [rows, numOfResults]) => {
    if (!err) {
      //display Paging Buttons
      let maxPageReached, leastPageReached, maxPage;
      maxPage = Math.ceil(numOfResults[0].counter/resultsPerPage);//max number of pages
      if(maxPage == pagenumber) maxPageReached = true;
      if(pagenumber == 1) leastPageReached = true;

      res.render('archive', { rows, pageUp, pageDown, paging, page, maxPageReached, leastPageReached });
    } else {
      console.log("this is error");
    }
  });
}
/* -------------------------------------------------- View Sales --------------------------------------------------*/
exports.view_sales  = (req, res) => {
  console.log("Sales Page");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  if(req.query.page){
    //  Paging process
    let paging = false; //starting point of paging
    let resultsPerPage = 14; //max number of results
    let pagenumber = req.query.page; //get page number from query
    let pageUp = pagenumber-1+2; //Page up
    let pageDown = pagenumber-1; //Page down
    let page = (pagenumber - 1)*resultsPerPage; //Page Limiter formula
    //  End of Paging

    let sql1 = 'SELECT *, DATE_FORMAT(date, "%b %d %Y") AS your_date, (daySales*product_price) as salesperday FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id ORDER BY date DESC LIMIT '+resultsPerPage+' OFFSET '+page+';';
    let sql2 = 'SELECT productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id group by salesandprofit.productID order by quantity asc limit 4;'; //lowest value
    let sql3 = 'SELECT productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id group by salesandprofit.productID order by quantity desc limit 4;'; //highest value
    let sql4 = 'SELECT COUNT(*) as counter FROM salesandprofit;';

    let sql = sql1+sql2+sql3+sql4;

    connection.query(sql, (err, [res1, res2, res3, numOfResults] ) => {
      if (!err) {
        //display Paging Buttons
        let maxPageReached, leastPageReached, maxPage; //Page Limitters
        maxPage = Math.ceil(numOfResults[0].counter/resultsPerPage);//max number of pages
        if(maxPage == pagenumber) maxPageReached = true;
        if(pagenumber == 1) leastPageReached = true;

        let a= res2.reverse(); if(JSON.stringify(a)==JSON.stringify(res3)){res2=null;} else {res2.reverse()};

        res.render('sales', {
          data1: res1,
          data2: res2,
          data3: res3,
          pageUp, pageDown, paging, page, maxPageReached, leastPageReached
        });
      } else {
        console.log(err);
      }
    });
  }else{
    let sql1 = 'SELECT *, DATE_FORMAT(date, "%b %d %Y") AS your_date, (daySales*product_price) as salesperday FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id ORDER BY date DESC LIMIT 14;';
    let sql2 = 'SELECT productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id group by salesandprofit.productID order by quantity asc limit 4;'; //lowest value
    let sql3 = 'SELECT productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id group by salesandprofit.productID order by quantity desc limit 4;'; //highest value

    let sql = sql1+sql2+sql3;

    connection.query(sql, (err, [res1, res2, res3] ) => {
      if (!err) {
        let paging = true;
        res.render('sales', {
          data1: res1,
          data2: res2,
          data3: res3,
          paging
        });
      } else {
        console.log(err);
      }
    });
  }
}
/* -------------------------------------------------- SEARCH BUTTON --------------------------------------------------*/

exports.findInventory = (req, res) => {
  console.log("Inventory Page - Search Button");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  let searchTerm = req.body.search;
  connection.query('SELECT * FROM inventory WHERE product_id LIKE ? OR product_name LIKE ? OR product_type LIKE ? LIMIT 14 ', ['%' + searchTerm + '%', '%' + searchTerm + '%', '%' + searchTerm + '%'], (err, rows) => {
    if (!err) {
      let searcher = true;
      res.render('inventory', { rows, searcher });
    } else {
      console.log(err);
    }
  });
}

exports.findSales = (req, res) => {
  console.log("Sales Page - Search Button");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  let sql1 = 'SELECT *, DATE_FORMAT(date, "%b %d %Y") AS your_date, (daySales*product_price) as salesperday FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id WHERE date = ? LIMIT 14;';
  let sql2 = 'SELECT productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id group by salesandprofit.productID order by quantity asc limit 4;'; //lowest value
  let sql3 = 'SELECT productID, product_name, sum(daySales) as quantity, sum(daySales*product_price) as totalsales FROM salesandprofit INNER JOIN inventory ON salesandprofit.productID=inventory.product_id group by salesandprofit.productID order by quantity desc limit 4;'; //highest value
  let sql = sql1+sql2+sql3;

  let searchTerm = req.body.search;
  connection.query(sql, [searchTerm], (err, [rows, res2, res3]) => {
    if (!err) {
      let a= res2.reverse(); if(JSON.stringify(a)==JSON.stringify(res3)){res2=null;} else {res2.reverse()};

      let searcher = true;
      res.render('sales', { 
        data1: rows,
        data2: res2,//least
        data3: res3,//most
        searcher });
    } else {
      console.log(err);
    }
  });
}

/* -------------------------------------------------- CONTROLLERS --------------------------------------------------*/

/* ----------------- get Add Item ----------------- */
exports.form = (req, res) => {
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  res.render('newuser');
}

/* ----------------- post Add Item ----------------- */
exports.create = (req, res) => {
  console.log("Inventory Page - Add Item - posting");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  const { product_name, product_price, product_type, stock_in, status, base_price} = req.body;

  connection.query('INSERT INTO inventory SET product_name = ?, product_price = ?, product_type = ?, stock_in = ?, status = ?, base_price = ?', 
  [product_name, product_price, product_type, stock_in, status, base_price], (err, rows) => {
    if (!err) {
      res.render('newuser', {alert: "Added Successfully"});
    } else {
      res.render('newuser', {alert1: "Invalid"});
    }
  });
}
  
/* ----------------- get Edit Item ----------------- */
exports.edit = (req, res) => {
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  connection.query('SELECT * FROM inventory WHERE product_id = ?', [req.params.product_id], (err, rows) => {
    if (!err) {
      res.render('edituser', { rows });
    } else {
      console.log(err);
    }
  });
}


/* ----------------- post Edit Item ----------------- */
exports.update = (req, res) => {
  console.log("Inventory Page - Edit Item - posting");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  const { product_name, product_price, product_type, stock_in, status, base_price} = req.body;

  connection.query('UPDATE inventory SET product_name = ?, product_price = ?, product_type = ?, stock_in = ?, status = ?, base_price = ? WHERE product_id = ?', 
    [product_name, product_price, product_type, stock_in, status, base_price, req.params.product_id], (err, rows) => {
    if (!err) {
      connection.query('SELECT * FROM inventory WHERE product_id = ?', [req.params.product_id], (err, rows) => {
        if (!err) {
          res.render('edituser', { rows, alert: "Editted Successfully" });
        } else {
          console.log(err);
        }
      });
    } else {
      console.log(err);
    }
  });
}

/* ----------------- Delete Item Inventory ----------------- */
exports.delete = (req, res) => {
  console.log("Inventory Page - Delete Item");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  connection.query('UPDATE inventory SET status = ? WHERE product_id = ?', ['inactive', req.params.product_id], (err, rows) => {
    if (!err) {
      res.redirect('inventory');
    } else {
      console.log(err);
    }
  });
}


/* ----------------- get Add Sales ----------------- */
exports.createSales = (req, res) => {
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  res.render('addSales');
}
/* ----------------- post Add Sales ----------------- */
exports.postNewSales = (req, res) => {
  console.log("Sales Page - Add Item - posting");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  const { date, product_id, daySales } = req.body;

  sql1 = 'SELECT (SELECT stock_in FROM inventory where product_id=?)-ifnull((SELECT sum(daySales) from salesandprofit where productID=?),0)-? AS availablestocks;';
  sql2 = 'INSERT INTO salesandprofit SET date = ?, productID = ?, daySales = ?;';

  connection.query(sql1, [product_id, product_id, daySales], (err, data1) => {
    if (!err && data1[0].availablestocks>=0) {
      connection.query(sql2, [date, product_id, daySales], (err, rows) => {
        if(!err){
          res.render('addSales', {rows, alert: "Added Successfully"});
        } else {
          res.render('addSales', {alert1: "Invalid"});
          console.log(err); 
        }
      });
    } else {
      console.log("error in adding")
      res.render('addSales', {alert1: "Invalid"});
      console.log(err);
    }
  });
}
/* ----------------- get Edit Sales ----------------- */
exports.editSales = (req, res) => {
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  connection.query('SELECT *, DATE_FORMAT(date, "%b %d, %Y") as datenow FROM salesandprofit WHERE salesID = ?', [req.params.salesID], (err, rows) => {
    if (!err) {
      res.render('editSales', { rows });
    } else {
      console.log(err);
    }
  });
}
/* ----------------- post Edit Sales ----------------- */
exports.updateSales = (req, res) => {
  console.log("Sales Page - Edit Item - posting");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  const { date, product_id, daySales } = req.body;

  sql1 = 'SELECT (SELECT daySales FROM salesandprofit WHERE salesID = ?)+(SELECT stock_in FROM inventory where product_id=?)-ifnull((SELECT sum(daySales) from salesandprofit where productID=?),0)-? AS availablestocks;';
  sql2 = 'UPDATE salesandprofit SET date = ?, productID = ?, daySales = ? WHERE salesID = ?;';

  connection.query('SELECT *, DATE_FORMAT(date, "%b %d, %Y") as datenow FROM salesandprofit WHERE salesID = ?', [req.params.salesID], (err, rows) => {
    connection.query(sql1, [req.params.salesID, product_id, product_id, daySales], (err, data1) => {
      if (!err && data1[0].availablestocks>=0) {
        connection.query(sql2, [date, product_id, daySales, req.params.salesID], (err, data2) => {
          if (!err) {
            res.render('editSales', {data2, alert: "Editted Successfully" });
          } else {
            res.render('editSales', {rows, alert1: "Invalid"});
            console.log(err);
          }
        });
      } else {
        res.render('editSales', {rows, alert1: "Invalid"});
        console.log(err);
      }
    });
  });
}
/* ----------------- Delete Item Sales ----------------- */
exports.remove = (req, res) => {
  console.log("Sales Page - Delete Item");
  if(req.session.myVisa == "" || req.session.myVisa == null){
    res.redirect('login');
    return;
  }

  connection.query('DELETE FROM salesandprofit WHERE salesID = ?', [req.params.salesID], (err, rows) => {
    if (!err) {
      console.log("success delete")
      res.redirect('../sales?page=1');
    } else {
      console.log(err);
    }
  });
}


/* ----------------- Logout ----------------- */
exports.logout = (req,res) => {
  console.log("Logout Button");

  req.session.destroy(function(err) {
    console.log("Success exit.");
    process.exit(0);
  })
}