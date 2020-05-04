const express = require('express');
const cors = require('cors');
const mysql = require('mysql')
const bodyParser = require('body-parser');
const _ = require('underscore');

const SELECT_PRODUCTS = "SELECT * FROM product";
const SELECT_SECTIONS = "SELECT * FROM lidl_section";
const SELECT_CART = "SELECT cart.uid, cart.unit, cart.quantity, cart.productId, lidl_section.id AS sectionId, " +
    "lidl_section.name AS sectionName, product.name AS productName FROM cart LEFT JOIN (lidl_section, product) " +
    "ON cart.productId = product.id AND product.section = lidl_section.id;";

const app = express()
const connection = mysql.createConnection({
    host: 'anton.bounceme.net',
    user: 'databases',
    password: 'databases',
    database: 'shopping_list'
})
connection.connect(err => {
    if(err) {
        return err
    }
});

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get('/', (req, res) => {
    res.send('Hello')
})

app.get('/products', (req, res) => {
    connection.query(SELECT_PRODUCTS, (err, results) => {
        if(err){
            return res.send(err)
        }else{
            return res.json(results)
        }
    })
})

app.get('/sections', (req, res) => {
    connection.query(SELECT_SECTIONS, (err, results) => {
        if(err){
            return res.send(err)
        }else{
            return res.json(results)
        }
    })
})

app.get('/cart', (req, res) => {
    connection.query(SELECT_CART, (err, results) => {
        if(err){
            return res.send(err)
        }else{
            return res.json(results)
        }
    })
})

app.get('/supported-stores', (req, res) => {
    connection.query('SELECT * FROM supportedMarkets;', (err, results) => {
        if(err){
            return res.send(err)
        }else{
            return results.map(result => {
                connection.query(`SELECT lidlSredzka.id, lidlSredzka.sectionId,lidl_section.name AS sectionName, 
                lidlSredzka.sectionOrder FROM ${result.tableReference} LEFT JOIN lidl_section ON 
                lidlSredzka.sectionId = lidl_section.id;`, (err, results) => {
                    if (err){
                        return res.send(err);
                    }else{
                        return res.json([{
                            ...result,
                            order: results
                        }])
                    }
                })
            })
        }
    })
})

app.all('/supported-stores/updateOrder', (req,res) => {
    const {store} = (req.query);
    const orderJson = req.body;
    let baseString = `INSERT INTO ${store}(id, sectionId, sectionOrder) VALUES `
    let endString = ` ON DUPLICATE KEY UPDATE sectionOrder=VALUES(sectionOrder);`
    let first = true
    for(let entry of orderJson){
        if(first){
            first = !first
        }else{
            baseString += ','
        }
        baseString += `(${entry.id}, ${entry.sectionId}, ${entry.sectionOrder})`
    }
    connection.query(baseString + endString, (err, results) => {
        if (err){
            console.log(err)
            return res.send(err)
        }else{
            // connection.query(`SELECT * FROM ${store};`, (err, results) => {
            //     if (err){
            //         console.log(err)
            //         return res.send(err)
            //     }else{
            //         console.log(results)
            //         return res.json(req.query);
            //     }
            // })
            console.log(results)
            return res.json(req.query);
        }
    })
    connection.commit()
})

app.get('/products/add', (req,res) => {
    const {name, default_unit, section} = req.query;
    const INSERT_PRODUCT = `INSERT INTO product(name, default_unit, section) 
    VALUES ('${name.replace('_', ' ')}', '${default_unit}', ${section});
    SELECT lidlSredzka.id, lidlSredzka.sectionId,lidl_section.name AS sectionName, 
                lidlSredzka.sectionOrder FROM ${result.tableReference} LEFT JOIN lidl_section ON 
                lidlSredzka.sectionId = lidl_section.id;`
    connection.query(INSERT_PRODUCT, (err, results) => {
        if (err){
            return res.send(err)
        }else{
            return res.json({id: results.insertId, ...req.query});
        }
    })
    connection.commit()
})

app.get('/cart/add', (req,res) => {
    const {productId, unit, quantity} = req.query;
    const INSERT_PRODUCT = `INSERT INTO cart(productId, unit, quantity) VALUES (${productId}, '${unit}', ${quantity});`
    connection.query(INSERT_PRODUCT, (err, results) => {
        if (err){
            console.log(err)
            return res.send(err)
        }else{
            const SELECT_PRODUCT_AS_CART_PRODUCT = `SELECT cart.uid, cart.unit, cart.quantity, cart.productId, lidl_section.id AS sectionId, lidl_section.name AS sectionName, product.name AS productName FROM cart, lidl_section, product WHERE cart.productId = product.id AND product.section = lidl_section.id AND cart.productId = ${productId};`
            return connection.query(SELECT_PRODUCT_AS_CART_PRODUCT, (err, results) => {
                if (err){
                    console.log(err)
                    return res.send(err)
                }else{
                    console.log(results)
                    return res.json(results)
                }});
        }
    })
    connection.commit();
})

app.get('/cart/updateProduct', (req,res) => {
    const {uid, productId, unit, quantity} = req.query;
    const UPDATE_PRODUCT = `UPDATE cart SET quantity=${quantity}, unit='${unit}'
    WHERE uid=${uid};`
    connection.query(UPDATE_PRODUCT, (err, results) => {
        if (err){
            return res.send(err)
        }else{
            return res.json(req.query);
        }
    })
    connection.commit()
})

app.get('/cart/deleteProduct', (req,res) => {
    const {uid} = req.query;
    connection.query(`DELETE FROM cart WHERE uid=${uid}`, (err, results) => {
        if (err){
            return res.send(err)
        }else{
            return res.json(req.query);
        }
    })
    connection.commit()
})

app.get('/cart/update', (req,res) => {
    const {cart} = (req.query);
    const cartJson = JSON.parse(cart);
    let baseString = "INSERT INTO cart(uid, productId, unit, quantity) VALUES "
    let endString = " ON DUPLICATE KEY UPDATE unit=VALUES(unit), quantity=VALUES(quantity)"
    let first = true
    for(let entry of cartJson){
        if(first){
            first = !first
        }else{
            baseString += ','
        }
        baseString += `(${entry.uid}, ${entry.productId}, '${entry.unit}', ${entry.quantity})`
    }
    connection.query(baseString + endString, (err, results) => {
        if (err){
            return res.send(err)
        }else{
            return res.json(req.query);
        }
    })
    connection.commit()
})

app.listen(4000, () => {
    console.log('Server listening on 4000')
})