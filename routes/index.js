const express = require("express");
const router = express.Router();

const { USER } = require("../querys");

module.exports = (db) => {
  const cardRoutes = require("./routes/cards");
  router.use("/cards", cardRoutes(db));
  const dashboardRoutes = require("./routes/dashboard");
  router.use("/dashboard", dashboardRoutes(db));
  const storeRoutes = require("./routes/stores");
  router.use("/stores", storeRoutes(db));

  router.get("/user", (req, res) => {
    db.query("select * from users where users.id = $1", [req.session.id]).then(
      (data) => res.json({ user: data.rows })
    );
  });

  router.post("/login", (req, res) => {
    const [query, params] = USER(req.body);
    db.query(query, params)
      .then((data) => {
        const user = data.rows;
        req.session.id = user[0].id;
        res.json({
          data: data.rows,
          user: user[0],
        });
      })
      .catch((err) => res.json({ error: err.message }));
  });

  router.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
  });

  return router;
};
