const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middlewires
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => { res.send('Semiconductor Inc Server Start') });

const uri = `mongodb+srv://${process.env.DB_USER
  }:${process.env.DB_PASS
  }@learningmongo.qf50z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) return res.status(403).send({ message: 'Forbidden access' });
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    await client.connect();
    //const servicesCollections = client.db('DoctorsPortal').collection('services');

    //verify admin
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterInfo = await userCollections.findOne({ email: requester });
      if (requesterInfo.role === 'admin') {
        next();
      } else {
        res.status(403).send({ message: 'forbidden' });
      }
    };

    
  } finally {

  }
}

run().catch(console.dir);
app.listen(port, () => { console.log(`Running Semiconductor Inc on port: ${port}`) });