
import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
from uuid import uuid4
app = express()
app.use(bodyParser.json())
__dirname = path.resolve()
# simple endpoints for demo
app.get('/api/ping', (req,res) => { return res.json({'ok': True}) })
app.listen(process.env.PORT || 3000)
