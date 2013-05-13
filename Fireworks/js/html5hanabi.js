function tglmute() {
	var audio = document.getElementById('bgm');
	if(audio.muted === true){
		audio.muted = false;
		$("#muteController").addClass("on").removeClass("off");
	} else {
		audio.muted = true;
		$("#muteController").addClass("off").removeClass("on");
	}
}

$(function () {
	if ($.browser.msie && $.browser.version <= 8) {
		var eventTitleBrowser = $('#eventTitleBrowser').text();
		$('#eventTitle')
			.find('.note, #btnStart').remove().end()
			.append('<p class="note">'+eventTitleBrowser+'</p><ul class="listBrowser"><li><a href="http://www.google.co.jp/chrome/intl/ja/landing_ch.html" title="Google Chrome"><img src="/img/event/hanabi/logo_chrome.png" width="82" height="82" alt="Google Chrome"></a></li><li><a href="http://www.apple.com/jp/safari/" title="Safari"><img src="/img/event/hanabi/logo_safari.png" width="83" height="91" alt="Safari"></a></li><li><a href="http://mozilla.jp/firefox/" title="Firefox"><img src="/img/event/hanabi/logo_firefox.png" width="86" height="84" alt="Firefox"></a></li><li style="top:-10px; position: relative; z-index:1;"><a href="http://windows.microsoft.com/ja-JP/internet-explorer/products/ie/home" title="Internet Explorer 9"><img src="/img/event/hanabi/logo_ie.png" width="73" height="71" alt="Internet Explorer 9"></a></li></ul>')
		;
		return;
	};
    $("#displayAbout").click(function () {
        $("#boxAbout").toggle();
    });
    $("#aboutClose").click(function () {
        $("#boxAbout").toggle();
    });
    var excludes = {
        'h3lD': true,
		'8lbR': true,
		'gwiQ': true,
		'iAm5': true,
		't86t': true,
		'tXKF': true,
		'apP6': true,
		'wuVK': true,
		'uR2A': true,
		'tF5B': true,
		'hgYD': true,
		'xXjr': true,
		'emH7': true,
		'r8ny': true,
		'knrf': true,
		'7lsv': true,
		'aumL': true,
		'4mZ2': true,
		'40NY': true,
		'fx4b': true,
		'gyqP': true,
		'BD04': true,
		'jpvQ': true,
		'gBBY': true,
		'2akH': true,
		'bdok': true,
		'mppy': true,
		'zb0X': true,
		'6J3t': true,
		'kQ0U': true,
		'rNLx': true,
		'sgtn': true,
		'2MWL': true,
		'yoQF': true,
		'hhjh': true,
		'bSRD': true,
		'vhCr': true,
		'skXT': true,
		'48BL': true,
		'fEdE': true,
		'5EQc': true,
		'o1PL': true,
		'3E1n': true,
		'9mI7': true,
		'AhQd': true,
		'dhfe': true,
		'gSCc': true,
		'y6LU': true,
		'cwtb': true,
		'4wlc': true,
		'dXfv': true,
		'qxrK': true,
		'aM6O': true,
		'6k7o': true,
		'1TAh': true,
		'sVFi': true,
		'9vc4': true,
		'wNec': true,
		'8dYE': true,
		'sed9': true,
		'g8FQ': true,
		'8jGJ': true,
		'uTXU': true,
		'73E1n': true
	};
    var selected = {
        '4YKk': true
    };
    var i, l;
    var canvas  = $('#hanabiCanvas');
    var hanabis_a = $.makeArray($('textarea'));
    var hanabis_b = [];

    var shuffle = function (array) {
        var i = array.length;
        var j, tmp;
        while (i) {
            j = Math.floor(Math.random() * i);
            tmp = array[--i];
            array[i] = array[j];
            array[j] = tmp;
        }
        return array;
    };
    var displayedAbout = false;
    var nextHanabi = function () {
        if (hanabis_a.length > 0) {
            return $(hanabis_a.shift());
        }
        else {
            var data1, data2;
            var layout = Math.floor(Math.random() * 4) + 1;
            if (! displayedAbout) {
                displayedAbout = true;
                $('#boxAbout').toggle();
            }
            data1 = hanabis_b.shift();
            if (! data1) { return null; }
            hanabis_b.push(data1);
            if (data1.layout) {
                layout = 1;
            }
            if (layout === 1) {
                return $('<textarea data-sec="4000"><div class="layout1 size750"><div class="fw1 hanabiItem"><iframe src="' + data1.src + '" width="100%" height="750"></iframe><p class="author"><span>made by <b>' + data1.user + '</b></span></p><a href="http://jsdo.it/' + data1.user + '/' + data1.path + '" class="external" target="_blank"></a></div></div></textarea>');
            }
            else {
                data2 = hanabis_b.shift();
                hanabis_b.push(data2);
                return $('<textarea data-sec="4000"><div class="layout' + layout + '"><div class="fw1 hanabiItem"><iframe src="' + data1.src + '" width="450" height="450"></iframe><p class="author"><span>made by <b>' + data1.user + '</b></span></p><a href="http://jsdo.it/' + data1.user + '/' + data1.path + '" class="external" target="_blank"></a></div>' +
                         '<div class="fw2 hanabiItem"><iframe src="' + data2.src + '" width="450" height="450"></iframe><p class="author"><span><b>made by ' + data2.user + '</b></span></p><a href="http://jsdo.it/' + data2.user + '/' + data2.path + '" class="external" target="_blank"></a></div></div></textarea>');
            }
        }
    };
    var launch; launch = function () {
        var children = canvas.children();
        children.css('opacity', 0);
        setTimeout(function () {
            var timer, hanabi;
            children.remove();
            hanabi = nextHanabi();
            if (! hanabi) { return; }

            timer = setInterval(function () {
                if ($("#boxAbout").css('display') === "none") {
                    clearInterval(timer);
                    var content = $(hanabi.text());
                    var iframe = content.find('iframe').css('opacity', 0);
                    iframe.load(function () {
                        $(this).css('opacity', 1);
                    });
                    canvas.append(content);
                    setTimeout(launch, hanabi.attr('data-sec'));
                }
            }, 500);
        }, 1000);
    };
    $('#btnStart').click(launch);

    var fetch; fetch = function (page) {
        $.ajax({
            url: 'http://api.jsdo.it/v0.2/code/search.json',
            data: {
                tag: 'hanabi',
                page: page
            },
            dataType: 'jsonp',
            success: function (data) {
                var i, l, code, elem;
                if (data.results) {
                    loop: for (i = 0, l = data.results.length; i < l; i++) {
                        code = data.results[i];
                        elem = {
                            src: ['http://jsrun.it', code.user.name, code.path].join('/'),
                            user: code.user.name,
                            path: code.path
                        };
                        if (selected[code.uid]) {
                            elem.layout = true;
                        }
                        if (! excludes[code.uid]) {
                            hanabis_b.push(elem);
                        }
                    }
                    hanabis_b = shuffle(hanabis_b);
                    if (l > 0) {
                        setTimeout(function () {
                            fetch(page + 1);
                        }, 10000);
                    }
                }
            }
        });
    };
    fetch(1);
});
