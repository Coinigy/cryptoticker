var firstConnect = true;
var SCsocket = {};

function message(theMessage) {
    $('.theMessage').html(theMessage);
    $('#messageBox').modal('show');
}

function showMenu() {
    $('.mainMenu').slideToggle();
    if (firstConnect == false) {
        $('.optionsMenu').removeClass('hide');
    }
}

function connectionError() {
    chrome.storage.sync.set({ 'confirmed': false }, function () {
    });
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
    chrome.storage.sync.remove(['apiKey', 'apiSecret', 'confirmed'], function () {
        message('Your API keys have been removed.');
        checkUserData();
        SCsocket.disconnect();
        $('.tickerObject').remove();
        $('.optionsMenu').addClass('hide');
    });
}



function checkUserData() {
    showSpinner();
    chrome.storage.sync.get(['apiKey', 'apiSecret', 'confirmed'], function (data) {
        
        console.log(data);
        if (data.confirmed == true) {
                if (!data.apiKey || !data.apiSecret) {
                    hideSpinner();
                    $('.niceTable').removeClass('hide');
                } else {
                    apiConnect(data);
                }
        } else {
            hideSpinner();
            $('.optionsMenu').addClass('hide');
            $('.niceTable').removeClass('hide');
                $('.step1').removeClass('hide');
                $('.step2').addClass('hide');
                $('#api_key').val(data.apiKey);
                $('#api_secret').val(data.apiSecret);
            
        }
        
    });
}



function saveUserData(confirm) {
    
    var api_key = $('#api_key').val();
    var api_secret = $('#api_secret').val();
    
    if (confirm == true) {
        if (!api_key || !api_secret) {
            message('Please enter your Coinigy.com API and Secret key.<br/><br/>If you need an account, <a href="https://www.coinigy.com">Click here</a>');
            return;
        }
    }
    // Save data using the Chrome extension storage API.
    chrome.storage.sync.set({ 'apiKey': api_key, 'apiSecret': api_secret }, function () {
    // add error handling
    });
    
    if (confirm == true) {
        chrome.storage.sync.set({ 'confirmed': true }, function () {
        });
        checkUserData();
    }

}

function apiConnect(userData) {
    showSpinner();
    SCsocket = socketCluster.connect({
        hostname: 'sc-01.coinigy.com',
        secure: true,
        port: 443
    });

    

    SCsocket.on('connect', function (status) {
        // console.log(status);

        SCsocket.emit("auth", userData, function (err, msg) {
            // console.log(msg);

            if (typeof err == 'undefined') {
                
                var scChannel = SCsocket.subscribe("TICKER");

                scChannel.watch(function (data) {

                    
                    // console.log(data);

                    for (var i in data) {
                        var divId = data[i].exch_code + "_" + data[i].display_name;
                        divId = divId.replace(/\//g, 'ForwardSlash');
                        console.log(data[i]);
                        var prevPrice = $("#" + divId + "").find('.lastPrice').html();


                        $("#" + divId + "").remove();
                        var tickerObject = '<div id="' + divId + '" class="col-md-12 tickerObject" data-exchcode="'+data[i].exch_code+'" data-mktname="'+data[i].mkt_name+'" style="padding-left:0px;">' +
                                                '<div class="exchangeCode">' + data[i].exch_code + '</div>' +
                                                '<div class="marketName">' + data[i].display_name + '</div>' +
                                                '<div class="priceData">' +
                                                    '<div id="lastPrice' + divId + '" class="lastPrice" style="width:100px;height:25px;">' + data[i].last_price + '</div>' +
                                                    '<div class="volume24h">' + data[i].btc_volume_24 + '</div>' +
                                                '</div>' +
                                                '<div class="miniChart"><img src="https://www.coinigy.com/s/svg/' + data[i].exch_code + '/' + data[i].display_name + '" width="110" /></div>' +
                                           '</div>';
                        $('#mainRow').append(tickerObject);

                        if (data[i].last_price > prevPrice) {
                            $("#lastPrice" + divId).prepend("<span class='arrow'>&#9650;</span>");
                            $("#lastPrice" + divId).addClass("highlightGreen");
                            $("#lastPrice" + divId).find('.arrow').addClass("disappearing");
                        } else if (data[i].last_price < prevPrice) {
                            $("#lastPrice" + divId).prepend("<span class='arrow'>&#9660;</span>");
                            $("#lastPrice" + divId).addClass("highlightRed");
                            $("#lastPrice" + divId).find('.arrow').addClass("disappearing");
                        }
                        
                        
                    }
                    if (firstConnect == true) {
                        $('.mainMenu').slideUp();
                        setTimeout(function () {
                            hideSpinner();
                        }, 500);
                        firstConnect = false;
                    }
                });


                //SCsocket.emit("exchanges", null, function (err, data) {
                //    if (!err) {
                //        console.log(data);
                //    } else {
                //        console.log(err);
                //    }
                //});


                //SCsocket.emit("channels", "OK", function (err, data) {
                //    if (!err) {
                //        console.log(data);
                //    } else {
                //        console.log(err);
                //    }
                //});

                
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
        // console.log('disconnect', arguments);
    });
}

checkUserData();

$(document).ready(function () {
    $('#activateButton').click(function () {
        saveUserData(true);
    });
    $('.action_icon').click(function () {
        showMenu();
    });
    $('#wipeUserData').click(function () {
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
            chrome.tabs.create({ url: $(this).attr('href') });
        }
        return false;
    });
    $('body').on('click', '.tickerObject', function () {
        chrome.tabs.create({ url: "https://www.coinigy.com/main/markets/" + $(this).data('exchcode') + "/" + $(this).data('mktname') });
    });
    
});