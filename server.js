const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

const API_KEY = "cagC6e1q77ShytdkJTxJKbBh";

app.use(express.static("public"));

app.post("/remover", upload.single("imagem"), async (req, res) => {
    try {
        const form = new FormData();
        form.append("image_file", fs.createReadStream(req.file.path));

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

        console.log("✅ API respondeu com sucesso");

        res.setHeader("Content-Type", "image/png");
        res.send(response.data);

    } catch (err) {
        console.log("🔥 ERRO DETALHADO:");

        if (err.response && err.response.data) {
            try {
                console.log(err.response.data.toString());
            } catch {
                console.log(err.response.data);
            }
        } else {
            console.log(err.message);
        }

        res.status(500).send("Erro na API");
    }
});

app.listen(3000, "0.0.0.0", () => {
    console.log("🔥 Rodando em http://localhost:3000");
});
