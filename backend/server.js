const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const { authMiddleware, adminMiddleware } = require("./authMiddleware");
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "A jelszónak minimum 8 karakterből kell állnia!",
      });
    }
    const [users] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length > 0)
      return res.status(400).json({ message: "Ez az email cím már foglalt!" });
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (name, email, password) VALUES (?,?,?)", [
      name,
      email,
      hashedPassword,
    ]);

    res.json({ message: "Sikeres regisztráció!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Szerverhiba történt!" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Ez hibás email vagy jelszó!" });
    }

    const user = users[0];

    const correctPassword = await bcrypt.compare(password, user.password);
    if (!correctPassword) {
      return res.status(400).json({ message: "Ez hibás email vagy jelszó!" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      message: "Sikeres bejelentkezés!",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

app.post(
  "/api/insertProducts",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, price, description } = req.body;

      if (
        !name?.trim() ||
        !Number.isInteger(Number(price)) ||
        Number(price) <= 0
      ) {
        return res.status(400).json({ message: "Hibás adatok!" });
      }

      const [products] = await db.query(
        "SELECT id FROM products WHERE name = ?",
        [name],
      );
      if (products.length > 0)
        return res
          .status(400)
          .json({ message: "Már van ilyen termék feltöltve!" });
      await db.query(
        "INSERT INTO products (name, price, description) VALUES (?,?,?)",
        [name, price, description],
      );
      res.json({ message: "Sikeres termék feltöltés!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Szerverhiba történt!" });
    }
  },
);

app.put(
  "/api/products/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, price, description } = req.body;

      if (
        !name?.trim() ||
        !Number.isInteger(Number(price)) ||
        Number(price) <= 0
      ) {
        return res.status(400).json({ message: "Hibás adatok!" });
      }

      const [result] = await db.query(
        "UPDATE products SET name=?, price=?, description=? WHERE id = ?",
        [name, price, description, req.params.id],
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Nincs ilyen termék!" });
      }
      res.json({ message: "Termék módosítva!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Szerverhiba történt!" });
    }
  },
);
app.delete(
  "/api/products/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const [result] = await db.query("DELETE FROM products WHERE id = ?", [
        req.params.id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Nincs ilyen termék!" });
      }
      res.json({ message: "Termék törölve!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Szerverhiba történt!" });
    }
  },
);
//userestema
app.get("/api/users", async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM users");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Szerverhiba!" });
  }
});

app.put(
  "/api/users/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const userid = req.user.id;
      if (userid != req.params.id) return res.status(418).json({ message: "NINCSEN EHHEZ SEMMMI JOGOD TE KUTYAHAHAHHAHAHAH" })
      const hashedPassword = await bcrypt.hash(password, 10);
      if (name == null) return res.status(400).json({ message: "Add meg a mostani neved ha nem akarod megváltoztatni!" });
      if (email == null) return res.status(400).json({ message: "Add meg a mostani email címed ha nem akarod megváltoztatni!" });
      if (password) {
        const [result] = await db.query(
          "UPDATE users SET name=?, email=?, password=?, role=0 WHERE id = ?",
          [name, email, hashedPassword, req.params.id],
        );
        res.json({ message: "Adataid módosítva!" });
      }
      else{
                const [result] = await db.query(
          "UPDATE users SET name=?, email=? WHERE id = ?",
          [name, email, req.params.id],
        );
        res.json({ message: "Adataid módosítva!" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Szerverhiba történt!" });
    }
  },
);
app.delete(
  "/api/users/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const [result] = await db.query("DELETE FROM products WHERE id = ?", [
        req.params.id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Nincs ilyen termék!" });
      }
      res.json({ message: "Termék törölve!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Szerverhiba történt!" });
    }
  },
);

app.listen(PORT, () => {
  console.log(`A szerver sikeresen fut a következő porton: ${PORT}`);
});
