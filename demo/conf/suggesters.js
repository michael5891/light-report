'use strict';

var Suggester       = require('../../lib/server/suggester.js'),
    BasicSuggester = Suggester.suggestersByType.basic,
    RegexpSuggester = Suggester.suggestersByType.regexp,
    LomSuggester    = Suggester.suggestersByType.lom,
    StaticSuggester = Suggester.suggestersByType.static;

var testAlphanumeric = function testAlphanumeric(text) {
    var hasNotAlphanumeric = /[^A-Za-z0-9_-]/.test(text);
    return !hasNotAlphanumeric;
};

// Amount Suggester
var AmountSuggester = Object.create(RegexpSuggester);
AmountSuggester.regex = /^((([1-9]\d*)(\.\d{0,2})?)|(([0-9]\d{0,2})(\.\d{0,3})?)(m|k|b))$/;

AmountSuggester.formatSuggestion = function (text) {
    //allow short amounts input 1m = 1,000,000
    if (isNaN(text)) {
        var format;
        text = text.toUpperCase();

        if (text.indexOf('M') !== -1) {
            text = text.replace('M', '');
            format = 'M';
        } else if (text.indexOf('K') !== -1) {
            text = text.replace('K', '');
            format = 'K';
        } else if (text.indexOf('B') !== -1) {
            text = text.replace('B', '');
            format = 'B';
        }

        switch (format) {
        case 'K':
            text = Number(text) * 1000;
            break;
        case 'M':
            text = Number(text) * 1000000;
            break;
        case 'B':
            text = Number(text) * 1000000000;
            break;
        default:
            text = Number(text);
        }
    }
    return text.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Price Suggester
var PriceSuggester = Object.create(RegexpSuggester);
PriceSuggester.regex = /^(([0-9]\d*)(\.\d{0,10})?)$/;

PriceSuggester.formatSuggestion = function (text) {
    var arr = text.split('.'),
        formatted = arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (arr.length > 1) {
        formatted = formatted + '.' + arr[1];
    }
    return formatted;
};

// ID Suggester
var IdSuggester = Object.create(RegexpSuggester);
IdSuggester.regex = /^([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$/;

IdSuggester.suggest = function (text, callback) {
    if (text) {
        text = text.toUpperCase();
    }
    RegexpSuggester.suggest.call(this, text, callback);
};

// Tickek ID Suggester
var TickekIdSuggester = Object.create(IdSuggester);
TickekIdSuggester.regex = /^([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})-([A-Z0-9]{6})$/;

// Order ID Suggester
var OrderIdSuggester = Object.create(IdSuggester);
OrderIdSuggester.regex = /^([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;

// CPTY Suggester
var Cpty = Object.create(IdSuggester);
Cpty.regex = /^([A-Z0-9]{4})$/;

// Floor Suggester
var Floor = Object.create(RegexpSuggester);
Floor.regex = /^([A-Z0-9]{4,4})$/;
Floor.suggest = function (text, callback) {
    if (text) {
        text = text.toUpperCase();
    }

    return RegexpSuggester.suggest.call(this, text, callback);
};

var fundCode = Object.create(RegexpSuggester);
fundCode.regex = /^([a-zA-Z0-9]{2,8})$/;
fundCode.suggest = function (text, callback) {
    if (text) {
        text = text.toUpperCase();
    }

    return RegexpSuggester.suggest.call(this, text, callback);
};

// CCY Suggester
var CCY = Object.create(LomSuggester);
CCY.ccys = [];
CCY.ccysString = ""; // a string concatenating all of the currencies. for search purposes, since 'regex.exec(str)' is ~10x faster than 'for->array->str.indexOf'

CCY.suggest = function (text, callback, user) {
    var count, ret, i,
        regex = new RegExp("\\b" + text, "gi"),
        regexMatch;

    if(testAlphanumeric(text) === true) { // limit to only alphanumeric chars!
        if (this.ccys.length === 0) {
            this.buildCcysArray();
        }

        count = this.ccys.length * 2;
        while ((regexMatch = regex.exec(this.ccysString)) !== null) {
            if (!ret) ret = [];
            // CCYs are always 3 letters long, plus the comma character their position in the string is always 4 times their position in the array
            ret.push(this.ccys[(regexMatch.index / 4)]);

            if (--count <= 0) {
                break;
            }
        }

        // old code that iterates over the whole array. slower than regex.exec
        /*for (count = 0; count < this.ccys.length; count++) {
         if (this.ccys[count].toUpperCase().indexOf(text.toUpperCase()) !== -1) {
         if (!ret) {
         ret = [];
         }
         ret.push(this.ccys[count]);
         }
         }*/
    }

    callback(null, ret);
};

CCY.buildCcysArray = function () {
	// TODO - build this list out of static data again, but in a way that will not throw error if static data isn't accessible
	this.ccysString = 'EUR,USD,JPY,CHF,RUB,CNH,AUD,GBP,CAD,HKD,NZD,BKT,NOK,SEK,MXN,SGD,CNY,CZK,DKK,HUF,ILS,PLN,RON,THB,TRY,ZAR,LPD,LPT,SAG,AED,ARS,BHD,BRL,CLP,COP,IDR,INR,KRW,KWD,KZT,MYR,PEN,PHP,SAR,TWD,WMT,XAG,XAU,XPD,XPT';
	this.ccys = this.ccysString.split(',');
};

// Order Status Suggester
var orderStatus = Object.create(StaticSuggester);
//orderStatus.data = formatters.orderStatus.values;

// Order ID Suggester
var orderID = Object.create(RegexpSuggester);
orderID.regex = /^([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;
orderID.suggest = function (text, callback) {
    if (text) {
        text = text.toUpperCase();
    }
    RegexpSuggester.suggest.call(this, text, callback);
};

var points = Object.create(BasicSuggester);
points.regex = /[0-9]+/;
points.suggest = function (text, callback) {
    var subText = text;

    if ((subText.charAt(0) === '+') || (subText.charAt(0) === '-')) {
        subText = subText.substring(1);
    }

    var index= subText.indexOf('.');
    if (index > 0) {
        subText = subText.substring(0, index) + subText.substring(index + 1);
    }

    var callbackCalled = false;
    if (subText.length <= 8) {
        var match = this.regex.exec(subText);

        if (match && match.length && (match[0] === subText)) {
            callbackCalled = true;
            callback(null, [text]);
        }
    }

    if (!callbackCalled) {
        callback();
    }
};

// Trader ID Suggester
var TraderIDSuggester = Object.create(RegexpSuggester); // both - first-party and counter-party traders
TraderIDSuggester.regex = /^(\w{3})$/;

TraderIDSuggester.suggest = function (text, callback) {
    var ccyRegex = new RegExp("\\b" + text + "\\b", "i");

    if (CCY.ccys.length === 0) {
        CCY.buildCcysArray();
    }

    if(!ccyRegex.test(CCY.ccysString)) { // the string is not a currency
        RegexpSuggester.suggest.call(this, text.toUpperCase(), callback);
    } else {
        callback();
    }
};


module.exports = {
    amount: AmountSuggester,
    price: PriceSuggester,
    cpty: Cpty,
    ccy: CCY,
    floor: Floor,
    fundCode: fundCode,
    id: IdSuggester,
    orderId: OrderIdSuggester,
    ticketId: TickekIdSuggester,
    orderStatus: orderStatus,
    orderID: orderID,
    points: points,
    trader: TraderIDSuggester
};
