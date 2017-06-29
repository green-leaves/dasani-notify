'use strict'
const request = require('request');
const cheerio = require('cheerio');
const emailjs = require('emailjs');

const LAZADA = 'http://www.lazada.sg';
const DASANI = LAZADA + '/catalog/?q=dasani';
const PRODUCT = '.c-product-card__name';
const PRICE = '.c-product-card__price-final';
const STOCK = '.c-quick-buy__button'
const DASANI_REGEX = /.*Dasani.* - .* 1\.5L x 12/g;
const INTERVAL = 3600 * 1000 * 6; // 6 hours

const user = process.argv[2];
const password = process.argv[3];
const recipent = process.argv[4];

var mail;

//Run application
run();

function run() {
    setupMail();
    
    check();
    setInterval(function() { 
        check();
    }, INTERVAL);
}

function check() {
    request(DASANI, function (error, response, html) {
      if (!error && response.statusCode == 200) {
        console.log("Load Successfully at: " + new Date());
        var $ = cheerio.load(html);
        $('.c-product-list__item').each(function(i, element) {
            console.log("====");
            
            let product = $(this).find(PRODUCT)
            let productName = product.text().trim();
            let productLink = LAZADA + product.attr('href').trim();
            let price = $(this).find(PRICE).text().replace("SGD", "").trim();
            let stock = $(this).find(STOCK).text().trim();
            
            console.log(productName);
            console.log(price);
            console.log(stock);
            console.log(productLink)
            
            if(isNotifiable(productName, price, stock)) {
                console.log("*** The chosen ONE ***")
                sendEmail(productName, price, productLink);
            }
        });

        console.log("====")
      }

    });
}

function isNotifiable(productName, price, stock) {

    let notifyFlg = false;
    let correctName = (DASANI_REGEX.exec(productName) != null);
    let correctPrice = parseFloat(price) < 6;
    let inStock = stock == "ADD TO CART";
    
    if(correctName && correctPrice && inStock) {
        notifyFlg = true;
    } 
    
    return notifyFlg;

}

function setupMail() {
    mail = emailjs.server.connect({
        user:     user, 
        password: password,
        host:     "smtp.gmail.com", 
        ssl:      true
    });
}

function sendEmail(productName, price, productLink) {
    mail.send(
                {
                   from:    user, 
                   to:      recipent,
                   subject: productName,
                   attachment: [
                        {data: "<html>" + productName + ", SGD " + price + " <br> " + productLink +  "</html>", alternative:true},
                   ]
                }, 
                afterSend
            );
    
    function afterSend(err, message) {
        console.log(err || message); 
    }
}

