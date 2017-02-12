var firstConnect = true;
var SCsocket = {};
var hasMarkets = false;
var confirmed = false;

Number.prototype.noExponents = function () {
    var data = String(this).split(/[eE]/);
    if (data.length == 1) return data[0];

    var z = '', sign = this < 0 ? '-' : '',
    str = data[0].replace('.', ''),
    mag = Number(data[1]) + 1;

    if (mag < 0) {
        z = sign + '0.';
        while (mag++) z += '0';
        return z + str.replace(/^\-/, '');
    }
    mag -= str.length;
    while (mag--) z += '0';
    return str + z;
}


function apiConnect(userData) {
    showSpinner();
    SCsocket = socketCluster.connect({
        hostname: 'sc-02.coinigy.com',
        secure: true,
        port: 443
    });

    

    SCsocket.on('connect', function (status) {


        SCsocket.emit("auth", userData, function (err, msg) {


            if (typeof err == 'undefined') {
                
                var scChannel = SCsocket.subscribe("TICKER");
                
                var checkMarkets = setTimeout(function () {
                    if (hasMarkets == false) {
                        message("<div>It looks like you may not have any <b>Favorite Markets</b> setup on Coinigy. <a href='https://www.coinigy.com/auth/login'>Click here to login and add Favorites</a><br/><img src='img/no_favorites.png'></div>");
                    }
                }, 10000);

                scChannel.watch(function (data) {
                        //console.log("scChannelData received...");
                        hasMarkets = true;
                        var divId = data.exch_code + "_" + data.display_name;
                        divId = divId.replace(/\//g, '_');
                        
                        var prevPrice = $("#" + divId + "").find('.lastPrice').html();
                        prevPrice = Number(prevPrice).noExponents();


                        data.last_price = Number(data.last_price).noExponents();

                        if (data.btc_volume_24 > 0) {
                            data.btc_volume_24 = Number(data.btc_volume_24).noExponents();
                        } else {
                            data.btc_volume_24 = Number(data.volume_24).noExponents();
                        }
                        
                        if (isNaN(prevPrice)) {
                            prevPrice = data.last_price;
                        }

                        
                        var textFontSize = "";
                        if (data.display_name.length > 9) { textFontSize = "tinyFontText"; }
                        if (data.display_name.length > 7) { textFontSize = "smallerFontText"; }
                        if (data.display_name.length < 8) { textFontSize = "largerFontText"; }


                        var priceFontSize = "";
                        if (data.last_price.length > 10) { priceFontSize = "smallerFont"; }
                        if (data.last_price.length < 9) { priceFontSize = "largerFont"; }

                        
                        if ($("#" + divId + "").length) {
                            $("#" + divId + "").find('.lastPrice').html(data.last_price);
                            $("#" + divId + "").find('.volume24h').html(data.btc_volume_24);
                            $("#" + divId + "").find('.arrow').remove();
                            $("#" + divId + "").find('.lastPriceContainer').removeClass("highlightGreen");
                            $("#" + divId + "").find('.lastPriceContainer').removeClass("highlightRed");
                            $("#" + divId + "").find('.lastPriceContainer').removeClass("smallerFont");
                            $("#" + divId + "").find('.lastPriceContainer').removeClass("largerFont");
                            $("#" + divId + "").find('.lastPriceContainer').addClass(priceFontSize);
                        } else {
                            var tickerObject = '<div id="' + divId + '" class="col-md-12 tickerObject" data-exchcode="' + data.exch_code + '" data-mktname="' + data.mkt_name + '" style="padding-left:0px;">' +
                                                    '<div class="exchangeCode">' + data.exch_code + '</div>' +
                                                    '<div class="marketName ' + textFontSize + '">' + data.display_name + '</div>' +
                                                    '<div class="priceData">' +
                                                        '<div id="lastPrice' + divId + '" class="lastPriceContainer ' + priceFontSize + '" style="width:100px;height:25px;"><span class="lastPrice">' + data.last_price + '</span></div>' +
                                                        '<div class="volume24h">' + data.btc_volume_24 + '</div>' +
                                                    '</div>' +
                                                    '<div class="miniChart"><img src="https://www.coinigy.com/s/svg/' + data.exch_code + '/' + data.display_name + '" width="110" /></div>' +
                                               '</div>';
                            $('#mainRow').append(tickerObject);
                        }
                        
                        
                            if (data.last_price > prevPrice) {
                                $("#" + divId + "").find('.lastPriceContainer').prepend("<span class='arrow'>&#9650;</span>");
                                $("#" + divId + "").find('.lastPriceContainer').addClass("highlightGreen");
                                $("#" + divId + "").find('.lastPriceContainer').find('.arrow').addClass("disappearing");
                            } else if (data.last_price < prevPrice) {
                                $("#" + divId + "").find('.lastPriceContainer').prepend("<span class='arrow'>&#9660;</span>");
                                $("#" + divId + "").find('.lastPriceContainer').addClass("highlightRed");
                                $("#" + divId + "").find('.lastPriceContainer').find('.arrow').addClass("disappearing");
                            }
                        
                        
                    
                    if (firstConnect == true) {
                        $('.mainMenu').slideUp();
                        setTimeout(function () {
                            hideSpinner();
                            returnWinSize();
                        }, 500);
                        firstConnect = false;
                    } else {
                        returnWinSize();
                    }
                    
                });

            }
        });
    });

    SCsocket.on('error', function (err) {
        message('Unable to connect. Did you enter the right API keys?');
        connectionError();
    });

    SCsocket.on('connectAbort', function () {
        message('Unable to connect. Did you enter the right API keys?');
        connectionError();
    });

    SCsocket.on('disconnect', function () {
        //console.log('disconnect', arguments);
    });
}


function message(theMessage) {
    $('.theMessage').html(theMessage);
    $('#messageBox').modal('show');
}

function showMenu() {
    $('.mainMenu').slideToggle();
    if (firstConnect == false) {
        $('.optionsMenu').removeClass('hide');
    }
    returnWinSize();
}

function connectionError() {
    self.port.emit("setConfirmed", false);
    checkUserData();
}


function showSpinner() {
    if (!$('.niceTable').hasClass('hide')) {
        $('.niceTable').addClass('hide');
    }
    $('.loader').removeClass('hide');
}

function hideSpinner() {
    if (!$('.loader').hasClass('hide')) {
        $('.loader').addClass('hide');
    }
}

function deleteUserData() {
    self.port.emit("deleteUserData");
}



function checkUserData() {
    showSpinner();
    self.port.emit("checkUserData");
}



function saveUserData(confirm) {
    
    var api_key = $('#api_key').val();
    var api_secret = $('#api_secret').val();
    var payload = { 'apiKey': api_key, 'apiSecret': api_secret };
    
    if (confirm == true) {
        if (!api_key || !api_secret) {
            message('Please enter your Coinigy.com API and Secret key.<br/><br/>If you need an account, <a href="https://www.coinigy.com">Click here</a>');
            return;
        }
    }

    self.port.emit("saveApiInfo", payload);

    
    if (confirm == true) {
        self.port.emit("setConfirmed", true);
    }

}


self.port.on("checkUserDataResp", function(data){
    if (data.confirmed == true) {
                if (!data.apiKey || !data.apiSecret) {
                    hideSpinner();
                    $('.niceTable').removeClass('hide');
                    returnWinSize();
                } else {
                    apiConnect(data);
                }
    } else {
        if (data.apiKey || data.apiSecret) {
            $('.step1').addClass('hide');
            $('.step2').removeClass('hide');
        } else {
            $('.step1').removeClass('hide');
            $('.step2').addClass('hide');
        }
        hideSpinner();
        $('.tickerObject').remove();
        $('.optionsMenu').addClass('hide');
        $('.niceTable').removeClass('hide');
        $('#api_key').val(data.apiKey);
        $('#api_secret').val(data.apiSecret);
        returnWinSize();
    }
});

self.port.on("deleteResp", function(){
    $('.tickerObject').remove();
    $('.optionsMenu').addClass('hide');
    returnWinSize();
    message('Your API keys have been removed.');
    checkUserData();
});

self.port.on("saveApiInfoResp", function(){
    
});

self.port.on("setConfirmedResp", function(conf){
    if(conf){
        checkUserData();
    }
});

function getScrollBarWidth () {
    var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
        widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
    $outer.remove();
    return 100 - widthWithScroll;
};

function returnWinSize(){
    var pageHeight = $('#mainRow').height();
    var pageWidth = 406;
    
    //console.log(pageWidth + "x" + pageHeight);
    if(pageHeight > 600){
        pageHeight = 600
        pageWidth = 406 + getScrollBarWidth();
    }

    self.port.emit("windowSize", {width: pageWidth, height: pageHeight});
}


$(document).ready(function () {
    $('#activateButton').click(function () {
        saveUserData(true);
    });
    $('.action_icon').click(function () {
        hideSpinner();
        //console.log("action icon clicked");
        showMenu();
    });
    $('#wipeUserData').click(function () {
        SCsocket.disconnect();
        deleteUserData();
    });
    $('.haveAccount').click(function (e) {
        e.preventDefault();
        $('.step1').addClass('hide');
        $('.step2').removeClass('hide');
    });

    $('#api_key').bind('input', function () {
        saveUserData();
    });
    $('#api_secret').bind('input', function () {
        saveUserData();
    });
    $('body').on('click', 'a', function () {
        if ($(this).attr('href') != "#") {
            self.port.emit("openTab", $(this).attr('href') );
        }
        return false;
    });
    $('body').on('click', '.tickerObject', function () {
             self.port.emit("openTab", "https://www.coinigy.com/main/markets/" + $(this).data('exchcode') + "/" + $(this).data('mktname') );
    });

});