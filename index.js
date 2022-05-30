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
    const userCollections = client.db('SemiconductorInc').collection('user');
    const productCollections = client.db('SemiconductorInc').collection('product');
    const orderCollections = client.db('SemiconductorInc').collection('orders');
    const opinionCollections = client.db('SemiconductorInc').collection('opinion');

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
    /***********************
    Product Management
     **********************/
    //get all products
    app.get('/products', async (req, res) => {
      const products = productCollections.find();
      const result = await products.toArray();
      res.send(result);
    });
    //get 6 products
    app.get('/product', async (req, res) => {
      const products = productCollections.find();
      const result = await products.limit(6).toArray();
      res.send(result);
    });
    //get discounted products
    app.get('/discountedProducts', async (req, res) => {
      const result = await productCollections.find({ discount: { $exists: true } }).toArray();
      res.send(result);
    });
    //get a products with id
    app.get('/item/:id', async (req, res) => {
      const id = req.params.id;;
      const product = await productCollections.findOne({ _id: ObjectId(id) });
      res.send(product);
    });
    //add a product
    app.post('/product', verifyJWT, verifyAdmin, async (req, res) => {
      const product = req.body;
      res.send(await productCollections.insertOne(product));
    });
    //remove a product
    app.delete('/product/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await productCollections.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    });

    /***********************
Orders Management
 **********************/
    //add a order
    app.post('/order', verifyJWT, async (req, res) => {
      const product = req.body;
      res.send(await orderCollections.insertOne(product));
    });
    //get all orders
    app.get('/orders', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const orders = orderCollections.find({ email: email });
      const result = await orders.toArray();
      res.send(result);
    });
    /***********************
    User Management
     **********************/
    //get all users
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      res.send(await userCollections.find().toArray());
    });
    //update or inset an user
    app.put('/user', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updatedDoc = { $set: user };
      const result = await userCollections.updateOne(filter, updatedDoc, options);
      const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
      res.send({ result, token });
    });
    //update profile
    app.put('/profile', verifyJWT, async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updatedDoc = { $set: user };
      const result = await userCollections.updateOne(filter, updatedDoc, options);
      res.send({ result });
    });
    //get user with email
    app.get('/user/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollections.findOne({ email: email });
      res.send(user);
    });


    /***********************
    Admin Management
     **********************/
    //getting admin
    app.get('/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollections.findOne({ email: email });
      if (user?.role === 'admin') res.send({ isAdmin: true });
      else res.send({ isAdmin: false });
    });
    //making or removing  admin
    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const role = req.body.role;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = { $set: { role } };
      const result = await userCollections.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    /***********************
contact use Management
 **********************/
    //add a opinion
    app.post('/opinion', verifyJWT, async (req, res) => {
      const opinion = req.body;
      res.send(await opinionCollections.insertOne(opinion));
    });
  } finally {

  }
}

run().catch(console.dir);
app.listen(port, () => { console.log(`Running Semiconductor Inc on port: ${port}`) });