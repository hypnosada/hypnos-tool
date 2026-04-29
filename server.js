const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================= IA API (REMOVE.BG) ================= */
const API_KEY = "XDNzKEKF5aviJnKuqCrryvqZ";

/* ================= "BANCO SIMPLES" DE CRÉDITOS ================= */
const users = {};

/* cria usuário automático */
function getUser(uid) {
  if (!users[uid]) {
    users[uid] = {
      credits: 3,
      lastReset: new Date().toDateString()
    };
  }

  // reset diário simples
  const today = new Date().toDateString();
  if (users[uid].lastReset !== today) {
    users[uid].credits = 3;
    users[uid].lastReset = today;
  }

  return users[uid];
}

/* gastar crédito */
function useCredit(uid) {
  const user = getUser(uid);

  if (user.credits <= 0) return false;

  user.credits--;
  return true;
}

/* ================= LOGIN VALIDATION (SUPABASE UID) ================= */
/*
IMPORTANTE:
O login real acontece no frontend via Supabase.
Aqui só confiamos no UID enviado.
*/

/* ================= CREDITOS ================= */
app.get("/credits", (req, res) => {
  const uid = req.query.uid;

  if (!uid) {
    return res.status(400).json({ error: "UID obrigatório" });
  }

  const user = getUser(uid);

  res.json({
    credits: user.credits
  });
});

/* ================= IA (REMOVE BG) ================= */
app.post("/remover", upload.single("imagem"), async (req, res) => {
  try {

    const uid = req.body.uid;

    if (!uid) {
      return res.status(401).send("Não logado");
    }

    const user = getUser(uid);

    if (user.credits <= 0) {
      return res.status(403).send("Sem créditos");
    }

    // consome crédito antes da IA
    useCredit(uid);

    const form = new FormData();
    form.append("image_file", fs.createReadStream(req.file.path));

    /* ================= IA REAL ================= */
    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-Api-Key": API_KEY
        },
        responseType: "arraybuffer"
      }
    );

    fs.unlinkSync(req.file.path);

    res.setHeader("Content-Type", "image/png");
    res.send(response.data);

  } catch (err) {
    console.log(err);
    res.status(500).send("Erro na IA");
  }
});

/* ================= START SERVER ================= */
app.listen(3000, () => {
  console.log("rodando em http://localhost:3000");
});
