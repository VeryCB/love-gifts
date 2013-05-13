debug = (location.hostname!=="jsdo.it");
log   = function() {
    if (debug) {
        try {
            console.log.apply(window,Array.prototype.slice.call(arguments));
        } catch(e) {}
    }
};
if (typeof console === 'undefined') {
    window.console = { 'log' : function () {} };
}
if (!window.console.debug) {
    window.console.debug = window.console.log;
}

Array.prototype.map = function( func ) {
    var i, ret = [];
    for ( i=0; i<this.length; i++ ) {
        ret.push( func.apply( this[i] ) );
    }
    return ret;
};


String.prototype.ucfirst = function() {
    return this.replace( /^\w/, function($0) { return $0.toUpperCase(); } );
};
String.prototype.path2pascal = function() {
    var pieces = this.split("/");
    return pieces.map( function() { return this.ucfirst(); } ).join("");
};
String.prototype.escapeHTML = (function _escapeHTML () {
    var reg = new RegExp('[&"<>\'\`\\#;%\/]', 'g');
    function esc (c) {
        return '&#'+c.charCodeAt(0)+';';
    };
    return function escapeHTML () {
        return this.replace(reg, esc);
    };
})();

// template engin(include escaping)
String.prototype.template = function template (param, options) {
    options = options || {};

    options.callback = options.callback || function callback (arg1, key) {
        return ((param[key] || '')+'').escapeHTML();
    };

    return this.replace(/\[%(.+?)%\]/g, options.callback);
};


// (new PathRouter( path, namespace )).dispatch("domLoaded")
PathRouter = Class.extend({
    instance: null,
    init: function( key, namespace ) {
        var cl = key.path2pascal();
        cl = (namespace ? namespace+"." : "")+cl;
        try {
            this.instance = controller = eval("new "+cl); // controller is global
        } catch(e) {
            cl = (namespace ? namespace+"." : "")+"Action";
            this.instance = controller = eval("new "+cl); // failover
        }
    },
    dispatch: function( event ) {
        this.instance[ event ].apply( this.instance );
    }
});


if ( typeof JSDoIt == "undefined" ) { JSDoIt = {}; }
JSDoIt.Action   = Class.extend({
    // default action
    domLoaded: function() {
        log("[domLoaded]");
    },
    beforeBodyLoaded: function() {
        log("[beforeBodyLoaded]");
        var search = $("#inputSearch");
        search.inputPrompt( search.attr("placeholder") );
    },
    enable_follow_button : function() {
        var follow_button = $("#follow_button");
        follow_button.click( function() {
            $.post("/api/user/follow", { target: user.screen_name, token : token },
                   function(data) {
                       log(data);
                       follow_button.attr("href", "/mypage");
                       follow_button.text( l('following') );
                       follow_button.unbind('click');
                    }, "json" );
            return false;
        });
        $("#unfollow_button").click( function() {
            if ( ! confirm( l('unfollow_confirm') ) ) { return; }
            $.post("/api/user/follow/destroy", { target: user.screen_name, token : token },
                   function(data) {
                        location.reload();
                   }, "json" );
            return false;
        });
    },
    smartPhoneUtils : function() {
        var current_uri = window.code_site_uri;
        if (!current_uri) {
            current_uri = window.generated_site_base +
                window.user_uri + '/' + window.code_path
            ;
        };
        current_uri += location.hash;

        // qr code
        (function () {
            var qrcode = $('.socialFeedback .qrcode');
            var base = qrcode.find('.btnBase');
            var qr = qrcode.find('.qr');
            base.click(function (e) {
                qr.stop(true, true).css('display') === 'block' ? qr.hide() : qr.show();
                e.stopPropagation();
            });
            $(window).click(function () {
                qr.stop(true, true).hide();
            });
            qr.find('img').attr('src', 'http://chart.apis.google.com/chart?chs=150x150&cht=qr&chl=' + encodeURIComponent(current_uri));
        })();

        // Smart Phone Preview
        (function () {
            $('.btnSmartphone').click(function () {
                var size = $(this).attr('data-size');
                window.open(current_uri, 'smartPhonePreviewWindow', size);
            });
        })();

    },
    loaded: function() {
        log("[loaded]");
    }
});

JSDoIt.AccountNameIndex = JSDoIt.Action.extend({
    init: function() {
        log("[AccountNameIndex][init]");
    },
    domLoaded: function() {
        this._super();

        $("#form_account_name").activate_form_validator({ validate_on_keyup : 1 });
    }
});

JSDoIt.AccountIndex = JSDoIt.Action.extend({
    init: function() {
        log("[AccountName][init]");
    },
    domLoaded: function() {
        this._super();

        var form = $("#form_account");
        if ( ! $.browser.msie ) { // sorry :(
            var icon_uploader = $("#icon");
            icon_uploader.uploader({
                post_data: { token: token },
                data_type: 'json',
                action:    '/api/account/icon',
                append_more: $("<img src='/img/common/access.gif' width='11' height='12' />"),
                change_handler: function(ev) {
                    icon_uploader.parents('.group').addClass("uploading");
                },
                submit_handler: function(data) {
                    icon_uploader.parents('.group').removeClass("uploading");
                    log( data );
                    if ( data.result == "ok" ) {
                        $("#account_icon_container").append( $("<img src='"+data.src+"?t="+(new Date).getTime()+"' width='100' height='100' />") );
                        $("#account_icon_delete_button").show();
                        $("#icon_id").val( data.icon_id );
                    }
                    else {
                        form.hilight_errors({ icon: data.error });
                    }
                }
            });
        }

        form.activate_form_validator({ on_error: function(){
            $( window ).trigger("resize"); // move uploader to the right place
        }});

        $("#account_icon_delete_button").click( function(ev) {
            $("#account_icon_container").html("");
            $(this).hide();
            $("#icon_id").val("");
        });

        $(".identifierDelete").each(function(i, elem) {
            $(elem).click(function(ev) {
                if (! confirm(l('account_identifier_delete_confirm'))) { return false; }
                $.ajaxSetup({
                    data: { token: token }
                });
                $.post(
                    "/api/account/identifiers/destroy", {
                        url: $(elem).children("a").attr("id"),
                        realm: $(elem).children('input').val()
                    }, function(data) {
                        if (data.result == "ok") {
                            $(elem).parent("dd").remove();
                        }
                        if ($(".identifierDelete").length == 0) {
                            $("#has_other_identifiers").remove();
                        }
                    }, "json"
                );
                return false;
            });
        });
        log('ok');
    }
});

JSDoIt.SearchIndex = JSDoIt.Action.extend({
    init: function() {
        log("[AccountName][init]");
        window.search_web_search_load = function (json) {
            search_web_search_load.json = json;
            if (window.search_web_search_load.loadend) {
                window.search_web_search_load.loadend();
            } else {
                window.search_web_search_load.loadend = function () {};
            };
        };
        window.exec_search = function (word) {
            if (!word) {
                window.search_web_search_load();
                return;
            };
            $(window.exec_search.script).remove();
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = 'async';
            script.defer = 'defer';
            var site = 'site:jsdo.it';
            var query = encodeURIComponent(site + ' ' + word);
            script.src = 'http://api.search.live.net/json.aspx?AppId=3D496ADC161455AC1A4F8EB96A52A04741E57400&Sources=Web&Web.Count=40&Web.Options=DisableHostCollapsing+DisableQueryAlterations&JsonType=callback&JsonCallback=search_web_search_load&Query='+query;
            var head = document.getElementsByTagName('head')[0];
            head.appendChild(script);
            window.exec_search.script = script;
        };
        window.exec_search(decodeURIComponent(location.hash.replace(/^#/, '')));
    },
    domLoaded: function() {
        this._super();
        var form = $('.sectSearchForm form').submit(function (e) {
            e.preventDefault();
            var self = $(this);
            var val = self.find(':text').val();
            var url = self.attr('action') + '#' + encodeURIComponent(val);
            self.attr('action', url);
            location.href = url;
        });

        if (window.search_web_search_load.loadend) {
            $(init);
        } else {
            window.search_web_search_load.loadend = function () {
                $(init);
            };
        };

        function init () {
            var raw_query = decodeURIComponent(location.hash.replace(/^#/, ''));
            $('#navGlobalSearch').find(':text').val(raw_query);

            //add search form event
            form.submit(function (e) {
                e.preventDefault();
                var word = $(this).find(':text').val();
                search_web_search_load.json = [];
                window.exec_search(word);
                location.hash = encodeURIComponent(word);
            });
            window.search_web_search_load.loadend = function () {
                show_result(window.search_web_search_load.json, form.find(':text').val());
            };
            show_result(window.search_web_search_load.json, raw_query);
        };
        function show_result (json, raw_query) {
            var escape_query = raw_query.replace(/[&"<>'\/]/g, function (c) {
                return '&#'+c.charCodeAt(0)+';';
            });
            $('.escapeQuery').text(escape_query);
            var sectResult = $('.sectResult').hide();
            if (!escape_query) {
                return;
            };

            var res = 
                json
                ? json.SearchResponse.Web
                : { 'SearchResponse' : { 'Web' : { 'Results' : [] } } }
            ;

            if (!res.Results || !res.Results.length) {
                return;
            };

            sectResult.show();
            form.find(':text').val(raw_query);

            var result = [];
            $(res.Results).each(function () {
                var tmpl = '<div class="unitSearchResult sectionLv1"><h2 class="title"><a href="[%Url%]">[%Title%]</a></h2><p class="linkUrl"><a href="[%Url%]">[%DisplayUrl%]</a></p><p class="sentence"><>[%Description%]</></p><!-- / .unitSearchResult --></div>'.template(this);
                var html = tmpl.replace(/<>(.+?)<\/>/g, function (arg1, text) {
                    return text.replace(new RegExp(escape_query, 'gi'), function (match) {
                        return '<span class="highlight">' + match + '</span>'
                    });
                });
                result.push(html);
            });
            sectResult.html(result.join(''));
        };
    }
});

JSDoIt.CodeShow = JSDoIt.Action.extend({
    init: function() {
        log("[CodeShow][init]");
        JSDoIt.CodeShow.addWidgetDesignBox();
    },
    initAjax: function() {
        $.ajaxSetup({
            data: { token: token }
        });
    },
    initViewers: function() {
        // global :-)
        js_editor      = new TabViewer({ textarea: $("#codeJS"),   type: "js",   lineNumbers: true, skipHighlight: has_long_line["js"],  box: $("#boxCodeJS") });
        css_editor     = new TabViewer({ textarea: $("#codeCSS"),  type: "css" , lineNumbers: true, skipHighlight: has_long_line["css"], box: $("#boxCodeCSS") });
        html_editor    = new Viewer(   { textarea: $("#codeHTML"), type: "html", lineNumbers: true, skipHighlight: has_long_line["html"] });
    },
    domLoaded: function() {
        this._super();
        this.initAjax();
        this.initViewers();
        this.initChangeTabs();
        this.selectActiveTab();
        this.enable_follow_button();
        this.smartPhoneUtils();

        // for 9leap event
        var show_9leap = function () {
            var btn9leap = $('.btn9leap').css('display', 'inline-block');
            btn9leap.find('a.btnBase').attr('href', 'http://9leap.net/games/new?fromURL='+location.href.replace(/[#|\?].+/, '')+'/download');
            $('#codeDetail > .code .fork p.btn9leap')
        };
        $('.meta .listTags a').each(function () {
            if ($(this).text() === '9leap') {
                show_9leap();
                show_9leap = function () {};
            };
        });

        // fav
        $("#favorite_button").click( function(e) {
            e.preventDefault();
            var box = $("#boxAddFav");
            box.stop(true, true).slideToggle();

            if ( box.data("activated") ) { return false; }
            box.data("activated", true);

            var form = $("#add_favorite_form");
            form.activate_form_validator({ transition: false, callback: function() {
                $("#reset_favorite").click();
                $("#favorite_button_img").attr("src", "/img/common/btn/btn_code_add_fav_d.png?t=1");
                $("#favorite_button")
                    .unbind("click")
                    .addClass("active")
                    .attr("href","/mypage?to=favorites");
            } });
            $("#reset_favorite").click( function() {
                box.stop(true, true).slideUp();
            });

            $.get("/api/code/tag", { uid: uid }, function(data) {
                // uniq前提
                var dummyinput;
                $('#tags').tagsInput({
                    use_autocomplete: true,
                    autocomplete: {
                        source: data.result
                    },
                    delimiter: ' ',
                    focus: function(input) {
                        dummyinput = input;
                        $(input).width('100px');
                        var deletable = false;
                        input.unbind('keyup');
                        input.bind('keyup', function(event) {
                            if (event.keyCode == 8 && deletable) {
                                var tags = $('#tags').val().split(' ');
                                tags.pop();
                                $('#tags_tagsinput .tag').remove();
                                $('#tags').tagsInput.importTags($('#tags')[0], tags.join(' '));
                                input.val('');
                            }
                            deletable = (input.val().length == 0);
                        });
                    },
                    defaultText: ''
                });
                $('#tags_tagsinput').css({ width: '265px', height: '60px' });
                $('input.ui-autocomplete-input').width('100px');
            });
            $.get("/api/code/tag/freq_ordered", { uid: uid }, function(data) {
                var container = $("#tags_container");
                if (! data.error) {
                    container.html('');
                    $.each(data.result, function(i, v) {
                        var li = $("<li><a href='#' class='tag'>"+v+"</a></li>");
                        li.click(function() {
                            $('#tags').addTag($(this).text());
                        });
                        container.append(li);
                    });
                }
            });
            return false;
        });
        $("#tags").activate_smart_candidates({ candidates: $(".tag") });

        $(window).bind('click.hide_favorite_button', function hide_favorite_button (e) {
            if (! $(e.target).is('#boxAddFav') && !$(e.target).closest('#boxAddFav').length) $("#reset_favorite").click();
        });

        // talk
        var talk_textarea = $("#code_talk_textarea").inputPrompt(l('code_talk_textarea_prompt_message'));
        var talk_form = $("#talk_form");
        talk_form.activate_form_validator({ transition: false, validate_on_blur: 0, callback: function(data) {
            $(".groupTalk").append( $(data.html) );
            talk_textarea.val("");
            talk_textarea.blur();
        }});
        // fork
        var fork_button = $('#fork_button');
        if (fork_button.length) {
            fork_button.click(function () {
                $('#form_fork').submit();
            });
        }
        // tweet count
        $.getJSON(
            'http://search.twitter.com/search.json?callback=?',
            { q: code_site_uri.replace(/jsrun/, 'jsdo') }, // from global
            function (data) {
                if (data.results.length > 0) {
                    $('section.stream').show();
                }
            }
        );
    },
    editor_is_ace: function() {
return false;
        return !this.editor_is_textarea();
    },
    editor_is_textarea: function() {
return false;
        return (typeof(editor_is_textarea)!="undefined") && editor_is_textarea; // global
    },
    selectActiveTab: function() {
        if ($('#description').text().length) {
            return;
        };
        var lines = {};
        $('#boxShowCode header small').each(function () {
            lines[$(this).closest('li').attr('class')] = parseInt($(this).text());
        });
        var selector = {};
        selector[lines['css']] = '.css';
        selector[lines['html']] = '.html';
        selector[lines['js']] = '.js';
        $('#boxShowCode header li').filter(selector[Math.max(lines['css'], lines['html'], lines['js'])]).click();
    },
    initChangeTabs: function () {
        $('#boxShowCode, #boxEditCode').find('header li').click(function () {
            var self = $(this);
            if (self.hasClass('active')) {
                return;
            };
            self.addClass('active')
                .siblings('.active').removeClass('active')
            ;
            var target = self.attr('data-target-tab');
            $('#'+target).show()
                .find('.code').trigger('resizeBox').end()
                .siblings('section').hide()
            ;
        });
    }
});

JSDoIt.CodeShow.play = function() {
    if ( (typeof(is_danger) != "undefined") && is_danger ) {
        if ( ! confirm( l('confirm_running_danger_code') ) ) {
            return;
        }
    }
    $( '#boxThumbViewer,#btnPlay' ).hide();
    var uri = window.code_site_uri + location.hash;
    $( '#generated_site' )[0].src = uri;
    $( '#btnStop,#btnReload' ).show();
};
JSDoIt.CodeShow.stop = function() {
    $( '#boxThumbViewer,#btnPlay' ).show();
    $( '#generated_site' )[0] .src = "";
    $( '#btnStop,#btnReload' ).hide();
};
JSDoIt.CodeShow.reload = function() {
    var uri = window.code_site_uri + location.hash;
    $( '#generated_site' )[0].src = uri;
};
JSDoIt.CodeShow.remove_talk = function( code_uid, talk_id ) {
    if ( ! confirm('really delete?') ) { return; }

    $("#unitTalk_" + talk_id).remove();
    $.post( "/api/code/talk/delete", { uid: code_uid, id: talk_id },
            function(data) {
                log(data);
            },
            "json" );
    return false;
};
JSDoIt.CodeShow.on_diff_click = function( uid1, uid2 ) {
    if ( this.diff_mode == true ) { return; }

    var slf = this;
    $.get( '/api/code/diff',
           { uid: uid1, uid2: uid2 },
           function(data) {
               if ( data.error ) {
                   log("[error]diff",data);
                   return;
               }
               $('#diff_container')
                   .show()
                   .html( data.html )
                   .css({ height: client_height()+'px' });
               $('#diff_controller')
                   .show();

               log("[diff]data: ",data);

               slf._originalScrollX = window.scrollX;
               slf._originalScrollY = window.scrollY;
               window.scrollTo(0,0);
           }
         );

    $("#diff_close_button").one( 'click', function() {
        slf.diff_mode = false;
        $('#diff_controller,#diff_container').hide();
        window.scrollTo( slf._originalScrollX, slf._originalScrollY );
        return false;
    });

    function client_height() {
        return Math.max( (window.innerHeight||0),
                         (document.body.clientHeight||0),
                         (document.body.offsetHeight||0),
                         (document.body.scrollHeight||0),
                         (document.documentElement.clientHeight||0),
                         (document.documentElement.scrollHeight||0)
                       );
    }
};
JSDoIt.CodeShow.addWidgetDesignBox = function() {
    $('li.embed span').toggle(function () {
        $(this).next().show();
    }, function () {
        $(this).next().hide();
    });
    $('.widgetDesignBox input').live('click', function () {
        var img = $('#'+$(this).attr('data-target'));
        img.show().siblings().hide();
        var textarea = img.closest('.widgetDesignBox').find('textarea');
        var val = textarea.val();
        if (/design/i.test(img.attr('id'))) {
            val = val.replace(/(\/blogparts\/\w+\/js)(\?view=design)?/, '$1?view=design')
        } else {
            val = val.replace(/(\/blogparts\/\w+\/js)(\?view=design)?/, '$1')
        }
        textarea.val(val);
    });
    $(window).click(function (e) {
        if ($(e.target).closest('.embed').length) return;
        $('li.embed div.embed').hide();
    });
};
JSDoIt.CodeRead = JSDoIt.CodeShow.extend({
    init: function() {
        log("[CodeRead][init]");
    },
    domLoaded: function() {
        this.initViewers();
    }
});

JSDoIt.EventJamSession = JSDoIt.CodeShow.extend({});
JSDoIt.EventGoogledeveloperdayIndex = JSDoIt.CodeShow.extend({});

JSDoIt.CodeFullscreen = JSDoIt.CodeShow.extend({
    init: function() {
        log("[CodeFullscreen][init]");
        JSDoIt.CodeShow.play();
        JSDoIt.CodeShow.addWidgetDesignBox();
    },
    domLoaded: function(){}
});

JSDoIt.BlogpartsIndex = JSDoIt.CodeShow.extend({
    init: function() {
        log("[BlogpartsIndex][init]");
    },
    domLoaded: function() {
        var to_ga = function () {
            _gaq.push(['_trackPageview', '/blogparts/play']);
            to_ga = function () {};
        };
        $("#btnPlay").click( function() {
            $(this).hide();
            $("#btnStop").show();
            JSDoIt.CodeShow.play();
            $("#generated_site").parent().show();
            to_ga();
        });
        $("#btnStop").click( function() {
            $(this).hide();
            $("#btnPlay").show();
            JSDoIt.CodeShow.stop();
            $("#generated_site").parent().hide();
        });
        $('#play_button').click(to_ga);
        this.initViewers();
        this.initChangeTabs();
        this.selectActiveTab();
        this.smartPhoneUtils();
    }
});

JSDoIt.CodeEdit = JSDoIt.CodeShow.extend({
    logger: null,
    confirm_beforeunload: 1,
    init: function() {
        log("[CodeEdit][init]");
    },
    editors: {},
    domLoaded: function() {
        this.initAjax();
        this.initChangeTabs();
        this.smartPhoneUtils();
        var self = this;
        // activity watcher, global
        activity_watcher = new ActivityWatcher( 1500, function() {
            if ( ! controller.editor_is_textarea()
              && ! controller.editor_is_ace()
              && (
                controller.editors["js"]  .get_codemirror_editor().isIMEOn() ||
                controller.editors["html"].get_codemirror_editor().isIMEOn() ||
                controller.editors["css"] .get_codemirror_editor().isIMEOn()
                )
            ) {
                return;
            }
            if ( $("#autoReload").attr("checked") ) {
                controller.save();
            }
        } );
        var editor_vars = {
            'js' : {
                'textarea' : $('#codeJS'),
                'type': 'js',
                'box' : $('#boxCodeJS'),
                'Highlight' : has_long_line['js'],
                'EditorClass' : TabEditor

            },
            'html' : {
                'textarea' : $('#codeHTML'),
                'type': 'html',
                'Highlight' : has_long_line['html'],
                'EditorClass' : Editor
            },
            'css' : {
                'textarea' : $('#codeCSS'),
                'type': 'css',
                'box' : $('#boxCodeCSS'),
                'Highlight' : has_long_line['css'],
                'EditorClass' : TabEditor
            }
        };
        // select default focus area 
        var default_focus = (function () {
            var area = {};
            var ar = [];
            $.each(editor_vars, function (name) {
                var len = this.textarea.val().length;
                area[len] = area[len] || name;
                ar.push(len);
            });
            return area[Math.max.apply(null, ar)];
        })();
        editor_vars[default_focus]['default_view'] = 1;
        // global :-)
        js_editor = create_editor(editor_vars['js']);
        html_editor = create_editor(editor_vars['html']);
        css_editor = create_editor(editor_vars['css']);
        function create_editor (options) {
            return options.editor_instance = new options.EditorClass($.extend({
                'saveFunction' : self.save,
                'onChange' : self.onChange,
                'cursorActivity' : self.onCursorActivity
            }, options));
        };
        this.editors[ "js" ]   = js_editor;
        this.editors[ "css" ]  = css_editor;
        this.editors[ "html" ] = html_editor;
        if (controller.editor_is_ace()) {
            editor_vars.get_textarea = function (name) {
                this[name]['ace_textarea'] = this[name]['ace_textarea'] || $(this[name]['textarea']).next().children('textarea').get(0);
                return this[name]['ace_textarea'];
            };
            var text_js = editor_vars.get_textarea('js');
            var text_html = editor_vars.get_textarea('html');
            var text_css = editor_vars.get_textarea('css');
            var fire_focus = text_js.fireEvent ? (function (elem) {
                elem.fireEvent('onfocus');
            }) : (function (elem) {
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent('focus', false, true);
                elem.dispatchEvent(evt);
            });
            fire_focus(editor_vars.get_textarea(default_focus));
            (function () {
                // 38 == up, 40 == down, 33 == page up, 34 == page down 
                var focus_keymap = {
                    'js' : { 38 : text_css, 40 : text_html, 33 : text_css, 34 : text_html },
                    'html' : { 38 : text_js, 40 : text_css, 33 : text_js, 34 : text_css },
                    'css' : { 38 : text_html, 40 : text_js, 33 : text_html, 34 : text_js }
                };
                $.each(editor_vars, function (key, val) {
                    if ('function' == typeof this) return;
                    var area = editor_vars.get_textarea(key);
                    $(area).data('type', val.type).bind('set_focus', function (undef, e) {
                        fire_focus(focus_keymap[$(this).data('type')][e.keyCode]);
                    });
                });
            })();
            var to_save = function (e) {
                $("#code_form").submit();
            };
            // add shortcut 
            $([text_js, text_html, text_css]).bind('keydown.shortcut.ctrl', function (e) {
                // 38 == up, 40 == down, 33 == page up, 34 == page down 
                if (e.ctrlKey && !e.shiftKey && (e.keyCode == 38 || e.keyCode == 40)) return $(this).trigger('set_focus', e);
                if (!e.ctrlKey && !e.shiftKey && (e.keyCode == 33 || e.keyCode == 34)) return $(this).trigger('set_focus', e);
            });
            $([text_js, text_html, text_css]).bind('keydown.shortcut.page', function (e) {
                if (complete.isCompleteMode()) return;
                // 13 == enter 
                if (e.ctrlKey && !e.shiftKey && e.keyCode == 13) return to_save(e);
            });
            var complete = new Autocomplete(editor_vars);
        };
        $("#code_form").submit( function(ev) {
            controller.save( 1 );
            return false;
        });

        // show meta info form 
        var input_panel = $('#boxCodeInformation .panelInput');
        input_panel.bind('open_panel', function () {
            $('#boxCodeInformation').css({
                'width' : $(window).width(),
                'height' : $(window).height()
            }).addClass('active');
        }).bind('close_panel', function () {
            var self = $('#boxCodeInformation');
            if (!self.hasClass('active')) {
                return;
            };
            self.css({
                'width' : 0,
                'height' : 0
            }).removeClass('active');
        });
        $("#ttl").focus(function () {
            input_panel.trigger('open_panel');
        });
        $("#btnProperties").click(function () {
            input_panel.trigger('open_panel');
        });
        $("#panelClose, #saveEdit").click(function () {
            input_panel.trigger('close_panel');
        });
        var panelExtensionInput = $('.panelExtensionInput');
        $(window).click(function (env) {
            if ($.contains(input_panel.get(0), env.target) || $.contains(panelExtensionInput.get(0), env.target)) {
                return;
            };
            input_panel.trigger('close_panel');
        });
        $(window).keydown(function (env) {
            if (env.keyCode !== 27) {
                return;
            };
            input_panel.trigger('close_panel');
            $('#code_meta_form').trigger('submit');
        });

        // extension settings 
        (function () {
            if ($.browser.msie && ($.browser.msie <= 8)) {
                $('.inputExtension').hide();
                return;
            };
            $('#extension').click(function () {
                $(this).trigger('toggle_extension_panel');
            }).bind('toggle_extension_panel', function () {
                $('.panelExtensionInput').show();
                $(this).attr('checked')
                    ? $('.panelExtensionInput').animate({'left' : 410}, 250)
                    : $('.panelExtensionInput').animate({'left' : -20}, 250)
                ;
            });
            $('.panelExtensionInput')
            .bind('dragover drop', function (e) { e.preventDefault(); })
            .bind('drop', function (e) {
                if (!e.originalEvent.dataTransfer) {
                    return;
                };
                $('#extensionFileIcon').trigger('update_data_uri',
                    [e.originalEvent.dataTransfer.files]
                );
            });
            $('#extensionFileIcon').bind('change', function () {
                $(this).trigger('update_data_uri', [$(this).attr('files')]);
            }).bind('update_data_uri', function (e, files) {
                $(new FileReader()).bind('load', function () {
                    $('.inputFileIcon img').attr('src', $(this).attr('result'));
                }).get(0).readAsDataURL(files[0]);
            });
            $('#boxCodeInformation .panelInput').bind('open_panel', function () {
                $('#extension').trigger('toggle_extension_panel');
            }).bind('close_panel', function () {
                $('.panelExtensionInput').hide();
            });
            $('.inputExtensionDownload button').click(function () {
                var param = {
                    'title' : $('#ttl').val(),
                    'current_time' : (function () {
                        var d = new Date;
                        return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('.');
                    })(),
                    'description' : $('#description').val().replace(/[\r\n]/g, ' '),
                    'image' : $('.inputFileIcon img').attr('src'),
                    'html_file' : $('#path').val()+'.html',
                    'html_url' : $('#previewArea').attr('src'),
                    'css_files' : get_file_path('css'),
                    'js_files' : get_file_path('js')
                };
                function get_file_path (type) {
                    var paths = controller.editors[type].get_all_tab_href();
                    paths.unshift(user_uri + '/' + $('#path').val());
                    return JSON.stringify($.map(paths, function (path) {
                        return 'http://' + location.hostname + path + '/' + type;
                    }));
                };
                if (!param.css_files || !param.css_files.length) {
                    delete param.css_files;
                };
                if (!param.js_files || !param.js_files.length) {
                    delete param.js_files;
                };
                var json = $('#extensionJson').val();
                json = json.replace(/\{%(\w+)%\}/g, function (all, name) {
                    return param[name];
                });
                $('#formExtensionDownload')
                    .find('[name="json"]')
                        .val(json)
                        .end()
                    .submit()
                ;
            });
        })();

        // code-meta編雁Eォーム
        var toggle_target  = $("#boxEditInfo");
        var code_meta_form = $("#code_meta_form");
        $("#ttl").activate_inplace_editor({
            toggle_target: toggle_target,
            form:          code_meta_form,
            cancel:        $("#cancelEdit"),
            validator_config: {
                callback: function() {
                    toggle_target.hide();
                    code_path = code_meta_form[0].path.value; // global

                    var title = code_meta_form[0].title.value;
                    $("#primaryTabTitle")   .text( title );
                    $("#primaryTabTitleCSS").text( title );
                    $("#ttlCodeText")       .text( title );
                }
            },
            onActivate: function() {
                $("#tags").activate_smart_candidates({ candidates: $(".tag") });
                var lock_button = $("#lock_button");
                if ( lock_button.length ) {
                    lock_button.lock({
                        input:        $("#path")
                    }); // 1hour
                }
            }
        });

        $("#path").keyup( function(ev) {
            var input = $(this);
            var val = input.val();
            if ( val.match(/[^0-9a-zA-Z-_.]/) ) { // validation error
                code_meta_form.hilight_errors({ path: l('invalid_path') });
                return;
            }
            else {
                code_meta_form.clear_errors();
            }
            $("#codePathPreview").text( val );
        });
        $('#saveCode').click( function () {
            $('#code_meta_form').trigger('submit');            
            return true;
        });
        // Finish Button
        var finishButtonTimer;
        $("#finishCode")
            .hover( function() {
                $("#balloonFinishCode").show();
                if ( finishButtonTimer ) {
                    clearTimeout( finishButtonTimer );
                }
                finishButtonTimer = setTimeout( function() {
                    finishButtonTimer = null;
                    $("#balloonFinishCode").hide();
                }, 2000 );
            })
            .click( function() {
                $('#code_meta_form').trigger('submit');
                controller.confirm_beforeunload = 0;
                setTimeout(function () {
                    controller.callSaveAPI(controller_callSaveAPI);
                }, 500);
                function controller_callSaveAPI (data) {
                    // anonymous user?
                    if (user_uri === "/anonymous") {
                        var dialogLogin = $("#dialogLogin");
                        if (! dialogLogin.data("activated")) {
                            dialogLogin.dialog({
                                autoOpen:  false,
                                draggable: false,
                                modal:     true,
                                resizable: false,
                                width:     450
                            });
                            dialogLogin.data("activated", true);
                        }
                        dialogLogin.dialog("open");
                        return;
                    }
                    // for QA
                    try {
                        if (window.opener && window.opener.save_code_url) {
                            window.opener.save_code_url(location.protocol + '//' + location.host + code_uri());
                            window.close();
                            return;
                        };
                    } catch (e) {}
                    location.href=code_uri(); // global
                };
                return false;
            })
        ;

        try {
            if (window.opener && window.opener.save_token) {
                window.opener.save_token(window.token);
            };
        } catch (e) {};

        $("#addLibrary").click( function(ev) {
            if ( ! $(this).data("activated") ) {
                $(this).data("activated",true);
                controller.activate_dialog();
            }

            controller.dialog_lang("js");
            $("#dialogSelectLib").dialog("open");
        });

        $("#addLibraryCSS").click( function(ev) {
            if ( ! $(this).data("activated") ) {
                $(this).data("activated",true);
                controller.activate_dialog();
            }

            controller.dialog_lang("css");
            $("#dialogSelectLib").dialog("open");
        });

        // message logger
        this.logger = new Logger( "#message" );
        this.logger.log("Ready!");

        // iframe
        this.reload_iframe( 1 );

        $("#btnReload").click( function() {
            controller.reload_iframe();
        });

        $(window).bind( "beforeunload", function(e) {
            if ( controller.confirm_beforeunload ) {
                return l("unload_confirm");
            }
        });

        (function () {
            if (!window.addEventListener || !window.JSON) {
                return;
            };
            var origin = $('#previewArea').attr('src').replace(/(\w)\/.+$/, '$1');
            window.addEventListener('message', function(e) {
                if (e.origin !== origin) return;
                var json = JSON.parse(e.data);
                if (json.type !== 'console.log') {
                    return;
                };
                self.logger.log(json.type + ' : ' + json.message);
            }, false);
        })();
    },
    callSaveAPI: function( callback ) {
        var action = $("#code_form").attr("action");
        log("-submit- -> "+action);

        // all from global
        $.post( action, {
            js:         js_editor.get_primary_code(),
            css:        css_editor.get_primary_code(),
            html:       html_editor.get_code(),
            uid:        uid
        }, callback, "json" );

        return false;
    },
    save: function( manual ) {
        this.callSaveAPI( function(data) {
            var lint_result = data.lint.js;
            controller.logger.log( manual ? "Saved." : "Auto Saved." );
            controller.logger.log( "Errors: "+lint_result.errors_count+" Warnings: "+lint_result.warnings_count );
            js_editor.clear_hilight();
            if ( lint_result.messages.length ) {
                $.each( lint_result.messages, function( index, value ) {
                    $.each( value, function( i, v ) {
                        controller.logger.log( "line("+i+"): "+v );
                        js_editor.hilight( i, v );
                    });
                });
            }
            if ( $("#autoReload").attr("checked") ) {
                controller.reload_iframe();
            }
            var saveButton = $("#saveCode");
            if ( ! saveButton.data("initialColor") ) { saveButton.data("initialColor", saveButton.css("background-color")); }
            saveButton
                .css("background-color", "#D6151B")
//                .animate({ "backgroundColor": saveButton.data("initialColor") }, 500)
            ;
        });
        return false;
    },
    onChange: function() {
        activity_watcher.start_timer();
    },
    onCursorActivity: function() {
        activity_watcher.reset_timer();
    },
    reload_iframe: function( init ) {
        $("#previewArea").attr("src", generated_site_uri() ); // from global
        this.logger.log( init ? "Loaded Site." : "Reloaded Site." );
    },
    loaded: function() {
        this.logger && this.logger.resize();
    },
    dialog_lang: function( lang ) {
        if ( typeof(lang) == "undefined" ) {
            return this._dialog_lang || "js";
        }
        // lang is "js" or "css"
        if ( lang == "js" ) {
            $(".jsLibs")
                .show()
                    .eq(0)
                    .attr("selected",true);
            $(".cssLibs").hide();
        }
        else if ( lang == "css" ) {
            $(".jsLibs").hide();
            $(".cssLibs")
                .show()
                    .eq(0)
                    .attr("selected",true);
        }
        return this._dialog_lang = lang;
    },
    activate_dialog: function() {
        var library_form = $("#formSelectLib");

        // form一つなのにリターンキーで追加されると困るEで..
        library_form.submit( function(){ return false; } );

        // Add Library
        $("#dialogSelectLib").dialog({
            autoOpen:  false,
            draggable: false,
            modal:     true,
            resizable: false,
            width:     450
        });

        // Major Libraries
        $( library_form[0].btnSelectMajorLib ).click( function(ev) {
            var button = $(this);
            controller.add_ref_ajax( library_form, button, $("#selectMajorLibs").val(), $("#boxSelectLibMajor") );
            return false;
        });

        // Your Recent Code
        $( library_form[0].btnSelectRecent ).click( function(ev) {
            var button = $(this);
            controller.add_ref_ajax( library_form, button, $("#selectRecent").val(), $("#boxSelectLibRecent") );
            return false;
        });

        // Input URLでライブラリ追加
        $("#inputLibPathGroup").children("input").keyup( function(ev) {
            var input = $(this);
            $( "#" + input.attr("id") +"_preview" ).text( input.val() );
        });
        $( library_form[0].btnSelectURL ).click( function(ev) {
            var button = $(this);

            var pathname = "/" + $("#library_username").val() + "/" + $("#library_codepath").val();
            controller.add_ref_ajax( library_form, button, pathname, $("#boxSelectLibURL") );
            
            return false;
        });
    },
    add_ref_ajax: function( form, button, pathname, box ) {
        if ( button.data('clicking') ) { return false; }
        button.data('clicking', true);

        $.post(
            form.attr('action') + "/" + this.dialog_lang(),
            {
                pathname:   pathname,
                uid:        uid // from global
            },
            function(data) {
                button.removeData('clicking');
                form.clear_errors();

                if ( data.error ) {
                    var errors = [];
                    $.each( data.error, function( index, value ) { errors.push( value ); } );
                    box
                        .addClass("boxError")
                        .find(".txtError")
                        .text( errors.join(', ') );
                }
                else {
                    $("#dialogSelectLib").dialog("close");
                    controller.editors[ controller.dialog_lang() ].add_tab( data.title, data.href );
                    controller.logger.log( "Added Library: " + data.title + "." );
                    if ( data.more_message ) {
                        controller.logger.log( data.more_message );
                        // GPLになった時...
                        $("#license").val("GPL");
                    }
                    controller.reload_iframe();
                }
            },
            "json"
        );
    }
});

JSDoIt.UserUser = JSDoIt.Action.extend({
    domLoaded: function(){
        this._super();

        $.ajaxSetup({
            data: { token: token }
        });
        this.enable_follow_button();
    },
    extract_from_class: function( source, prefix ) {
        // UserUserでは使わなぁEどそE子で使
        var classes = source.className;
        var uids    = $.grep( $.map( classes.split(' '), function(value, index) {
            var match = value.match( new RegExp("^"+prefix+"(.*)") );
            return match ? match[1] : null;
        }), function( value, index ) {
            return value;
        });
        return uids[0];
    }
});

JSDoIt.UserCodes = JSDoIt.UserUser.extend({
    domLoaded: function() {
        this._super(); // ajaxSetup, follow, unfollow

        $(".delete_button").live("click", function(ev) {
            if ( ! confirm( l('code_delete_confirm') ) ) { return false; }

            var delete_button = this;
            var uid = controller.extract_from_class( delete_button, "code_" );
            $.post("/api/code/destroy", { uid: uid }, function(data) {
                log(data);
                $(delete_button).parents(".unitCode").remove();
            });
            return false;
        });
    }
});

JSDoIt.UserFavorites = JSDoIt.UserUser.extend({
    domLoaded: function() {
        this._super(); // ajaxSetup, follow, unfollow

        $(".delete_button").live("click", function(ev) {
            if ( ! confirm( l('favorite_delete_confirm') ) ) { return false; }

            var delete_button = this;
            
            var classes = this.className;
            var id = controller.extract_from_class( delete_button, "code_" );
            $.post("/api/code/favorite/delete", { uid: id }, function(data) {
                log(data);
                $(delete_button).parents(".unitCode").remove();
            });
            return false;
        });
    }
});

OpenningAnimation = Class.extend({
    init: function( type ) {
        this.type    = type;
        this.section = $("#sect"+type);
    },
    start: function() {
        if ( this.timer ) {
            clearTimeout( this.timer );
            this.timer = null;
        }
        $("#navGuide"+this.type).addClass("selected");
        $("#boxFrontGuideOpen section").hide();
        this.section.show();
    },
    stop: function() {
        if ( this.timer ) {
            clearTimeout( this.timer );
            this.timer = null;
        }
        if ( this.animating ) {
            this.animating.stop( true );
        }
        this.section.hide();
    },
    next: function( idle ) {
        var slf = this;
        this.timer = setTimeout( function() {
            controller.next_animation( slf.type );
        }, idle || 2000 );
    }
});
QaOpenningAnimation = OpenningAnimation.extend({
    start: function() {
        this._super();

        var slf     = this;
        var section = this.section;

        // init
        $("#boxFrontGuideOpen li").css({opacity:"", left:"", top:""});
        var balloonQa_1 = $("#balloonQa_1").css("opacity",0);
        var balloonQa_2 = $("#balloonQa_2").css("opacity",0);
        var balloonQa_3 = $("#balloonQa_3").css("opacity",0);
        var balloonQa_4 = $("#balloonQa_4").css("opacity",0);

        this.animating = $("h1", section)
            .css("opacity",0)
            .animate( {opacity:1}, 1000, function(){
                slf.animating = balloonQa_1.animate( {opacity:1}, 700, "swing", function(){
                    slf.animating = balloonQa_2.animate( {opacity:1}, 500, "swing", function(){
                        slf.animating = balloonQa_3.animate( {opacity:1, top:"-=10px"}, 500, "swing", function(){
                            slf.animating = balloonQa_4.animate( {opacity:1}, 500, "swing", function(){
                                slf.next();
                                slf.animating = null;
                            });
                        });
                    });
                });
            })
        ;
    }
});
ForkOpenningAnimation = OpenningAnimation.extend({
    start: function() {
        this._super();

        var slf     = this;
        var section = this.section;

        // init
        $("#boxFrontGuideOpen li").css({opacity:"", left:"", top:""});
        var guideFork_1 = $("#guideFork_1")                      .css("opacity",0);
        var guideFork_2 = $("#guideFork_2")                      .css("opacity",0);
        var guideFork_3 = $("#guideFork_3")                      .css("opacity",0);
        var balloonGuideFork_1 = $("#balloonGuideFork_1")        .css("opacity",0);
        var balloonGuideForkFork_1 = $("#balloonGuideForkFork_1").css("opacity",0);
        var balloonGuideForkFork_2 = $("#balloonGuideForkFork_2").css("opacity",0);
        var balloonGuideForkFork_3 = $("#balloonGuideForkFork_3").css("opacity",0);

        this.animating = $("h1", section)
            .css("opacity",0)
            .animate( {opacity:1}, 1000, function(){
                slf.animating = guideFork_1.animate( {opacity:1}, 1000, "swing", function(){
                    slf.animating = balloonGuideFork_1.animate( {opacity:1, top: "219px"}, 500, "swing" );
                    slf.animating = guideFork_2.animate( {opacity:1}, 1000, "swing", function(){
                        slf.animating = guideFork_3.animate( {opacity:1}, 700, "swing", function(){
                            balloonGuideForkFork_1.animate( {opacity:1, left:"316px"}, 400, "swing");
                            balloonGuideForkFork_2.animate( {opacity:1, left:"316px"}, 400, "swing");
                            slf.animating = balloonGuideForkFork_3.animate( {opacity:1, left:"316px"}, 400, "swing", function() {
                                slf.next();
                                slf.animating = null;
                            });
                        });
                    });
                });
            });
    }
});
CodeOpenningAnimation = OpenningAnimation.extend({
    start: function() {
        this._super();

        var slf     = this;
        var section = this.section;

        // init
        $("#boxFrontGuideOpen p").css({opacity:"", left:"", top:""});
        var browserCode    = $("#browserCode")    .css("opacity",0);
        var balloonJs      = $("#balloonJs")      .css("opacity",0);
        var balloonHtml    = $("#balloonHtml")    .css("opacity",0);
        var balloonCss     = $("#balloonCss")     .css("opacity",0);
        var balloonDisplay = $("#balloonDisplay") .css("opacity",0);
        var h1             = $("h1", section)     .css("opacity",0);

        this.animating = h1
            .animate( {opacity:1}, 1000, function(){
                slf.animating = browserCode.animate( {opacity:1}, 700, "swing", function(){
                    balloonJs.animate( {opacity:1, top: "-=10px"}, 500, "swing");
                    balloonHtml.animate( {opacity:1, top: "-=10px"}, 500, "swing");
                    slf.animating = balloonCss.animate( {opacity:1, top: "-=10px"}, 500, "swing", function(){
                        slf.animating = balloonDisplay.animate( {opacity:1, top: "+=10px"}, 800, "swing", function() {
                            slf.next();
                            slf.animating = null;
                        });
                    });
                });
            });
    }
});
OpenOpenningAnimation = OpenningAnimation.extend({
    start: function() {
        this._super();

        var slf     = this;
        var section = this.section;

        section.show();
        $("#logoGuideOpen")
            .css({ opacity: 0 })
            .animate(
            { opacity: 1 }, 3000, "swing", function(){
                $(this).fadeOut(1000, function(){
                    //$("#sectCode").show();
                    $("#navGuide").fadeIn(500);
                    $("#btnCodeNew").fadeIn(500, function(){
                        slf.next( 500 );
                    });
                });
                $("#btnGuideClose").fadeIn(1000);
            });
    }
});

JSDoIt.Index = JSDoIt.Action.extend({
    animations: [],
    domLoaded: function() {
        this._super();

        // close guide 
        $("#btnGuideClose").click(function(){
            var anim = controller.current_animation();
            if ( anim ) {
                anim.stop();
            }
            $("#boxFrontGuide").animate(
                { "height": "26px" }, 1000, "swing", function(){
                    $("#boxFrontGuideClose").fadeIn();
                });
            JSDoIt.cookie('guide_display', 'none', { expires: 365 });
            return false;
        });

        // open guide
        $("#btnGuideOpen").click(function(){
            $("#btnGuideClose,#btnCodeNew,#navGuide").show();
            $("#boxFrontGuide").animate({ "height": "323px" }, 1000, "swing" );
            $("#boxFrontGuideClose").slideUp(500);
            $("#boxFrontGuideOpen").slideDown(500);
            JSDoIt.cookie('guide_display', 'block', { expires: 365 });
            controller.start( "Code" );
            return false;
        });

        // tab
        //var tab = $(".navGuideButton");
        var tab = $("#navGuideCode,#navGuideFork,#navGuideQa");
        tab.click(function(ev){
            tab.removeClass("selected");

            var selected = $(this);
            selected.addClass("selected");

            var type = selected.attr("id").substr(8); // Code/Fork/Qa
            controller.start( type );

            return false;
        });

        if ( (typeof(guide_display)!="undefined") && (guide_display == "block") ) { // from global
            $("#dummyGuideOpen").hide();
            this.start( "Open" );
        }
        else {
            $("#dummyGuideClose").hide();
            $("#boxFrontGuideClose").show();
        }
        // dashboard time ago
        (function () {
            var updateTime = function () {
                $('time').each(function (i, e) {
                    var datetime = $(e);
                    $(e).text(simpleTimeago(datetime.attr('datetime'), language))
                });
            };
            setInterval(updateTime, 10000);
            updateTime();
        }());
    },
    next_animation: function( type ) {
        var type_map = {
            Open: "Code",
            Code: "Fork",
            Fork: "Qa",
            Qa:   "Code"
        };
        this.current_animation().stop();
        controller.start( type_map[ type ] );
    },
    current_animation: function( anim ) {
        if ( anim ) {
            if ( this._current_animation ) {
                this._current_animation.stop( true );
            }
            this._current_animation = anim;
        }
        return this._current_animation;
    },
    animation: function( type ) {
        if ( ! this.animations[ type ] ) {
            this.animations[ type ] = eval("new "+type+"OpenningAnimation('"+type+"')");
        }
        return this.animations[ type ];
    },
    start: function(type) {
        $(".navGuideButton").removeClass("selected");

        $("#boxFrontGuideOpen").show();

        var animation = this.animation( type );
        this.current_animation( animation );

        animation.start();
    }
});

JSDoIt.QaIndex = JSDoIt.Action.extend({
    init: function() {
        log("[QaIndex][init]");
    },
    domLoaded: function() {
        this._super();
        $('time').each(function(index, e) {
            var time = $(e);
            time.find('a').text(simpleTimeago(time.attr('datetime'), language));
            time.show();
        });
        $.ajax({
            url: '/api/qa/tag/popular_tags',
            dataType: 'json',
            success: function(data) {
                if (data.error) return;
                var ul = $('#popular_tags');
                for (var i = 0, l = data.result.length; i < l; i++) {
                    var v = data.result[i];
                    ul.append($('<li>').append($('<a>').attr({ href: "/qa/tag/" + v[0] }).text(v[0] + ' (' + v[1] + ')')));
                }
            }
        });
    }
});

JSDoIt.QaCreate = JSDoIt.Action.extend({
    form_id: "#form_question",
    validate_action: null,
    preview: true,
    init: function() {
        log("[QaCreate][init]");
    },
    domLoaded: function() {
        this._super();

        var form = $(this.form_id);
        var inputs = form.find(':input')
            .addClass('preventErrorMessage')
            .blur(function(e) {
                $(this).removeClass('preventErrorMessage');
            });
        var selected_index = -1;
        var code_url = form.find(':input[name=code]');
        var codes = $('.selectMyCodes').find('li').each(function(i, e) {
            $(e).hover(function() {
                selected_index = i;
                codes.css('background', '');
                $(this).css('background', '#eee');
                code_url.val($(codes[selected_index]).find('span').text());
            }, function() {
                selected_index = -1;
                $(this).css('background', '');
            });
        });
        function set_code() {
            code_url.unbind('keydown');
            $('.selectMyCodes').hide();
        }
        code_url.focus(function() {
            $('.selectMyCodes').show();
            code_url.keydown(function(e) {
                if (e.keyCode == 38 || e.keyCode == 40) {
                    if (e.keyCode == 38) {
                        if (selected_index > 0) selected_index--;
                    } else {
                        if (selected_index < codes.length - 1) selected_index++;
                    }
                    code_url.val($(codes[selected_index]).find('span').text());
                    for (var i = 0; i < codes.length; i++) {
                        $(codes[i]).css('background', i == selected_index ? '#eee' : '');
                    }
                    return false;
                }
                if (e.keyCode == 13) {
                    set_code();
                    return false;
                }
                $('.selectMyCodes').hide();
                return true;
            });
        });
        code_url.focusout(set_code);
        function changeClass(errors) {
            for (var i = 0; i < inputs.length; i++) {
                var input = $(inputs[i]);
                var name = input.attr('name');
                if (name == 'token' || name == "") continue;

                input.parent().removeClass('valid invalid');
                if (name && errors[name]) {
                    if (! input.hasClass('preventErrorMessage')) {
                        input.parent().addClass('invalid');
                    }
                }
                else {
                    input.parent().addClass('valid');
                }
            }
        }
        var params = {
            on_error: function(data) {
                changeClass(data.error);
                $('#submit_button').addClass('inactive').attr('disabled', 'disabled');
            },
            on_ok: function(data) {
                changeClass([]);
                $('#submit_button').removeClass('inactive').removeAttr('disabled');
            }
        };
        if (this.validate_action) params.validate_action = this.validate_action;
        form.activate_form_validator(params);

        if (this.preview) {
            function escapeHTML(str) {
                return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            }
            form.keyup(function() {
                $('#preview_title').text($(this).find(':input[name=title]').val());
                var content = $(this).find(':input[name=content]').val();
                $('#preview_content').html(escapeHTML(content).replace(/\n/g, '<br>'));
            });
        }

        window.save_token = function (token) {
            $('#fork_code, #create_code').find('[name="token"]').val(token);
        };

        window.save_code_url = function (url) {
            $('#form_answer, #form_question').find('[name="code"]').val(url);
        };

        $('#create_button').click(function(e) {
            $('#create_code').submit();
            return false;
        });

        // tags
        var tags = [];
        $.ajax({
            url: '/api/qa/tag/popular_tags',
            dataType: 'json',
            success: function(data) {
                if (data.error) return;
                var ul = $('#popular_tags');
                var candidates = $('#tag_candidate_popular');
                for (var i = 0, l = data.result.length; i < l; i++) {
                    var v = data.result[i];
                    tags.push(v[0]);
                    ul.append($('<li>').append($('<a>').attr({ href: "/qa/tag/" + v[0] }).text(v[0] + ' (' + v[1] + ')')));
                    candidates
                        .append($('<a href="#">').click(function(e) {
                            $('#tags').addTag($(this).text());
                            return false;
                        }).text(v[0])).append(' ');
                }
                get_my_tags();
            }
        });
        var get_my_tags = function() {
            $.ajax({
                url: '/api/qa/tag/my_tags',
                dataType: 'json',
                success: function(data) {
                    if (data.error) return;
                    if (data.result.length > 0) {
                        var candidates = $('#tag_candidate_popular');
                        candidates
                            .append($('<br>'))
                            .append($('<span>').text('your : '));
                        for (var i = 0, l = data.result.length; i < l; i++) {
                            var v = data.result[i];
                            tags.push(v);
                            candidates
                                .append($('<a href="#">').click(function(e) {
                                    $('#tags').addTag($(this).text());
                                    return false;
                                }).text(v)).append(' ');
                        }
                    }

                    if ($('#tags').length) {
                        var sources = (function() {
                            var ret = [], obj = {};
                            for (var i = 0, l = tags.length; i < l; i++) {
                                obj[tags[i]] = 1;
                            }
                            for (var i in obj) {
                                ret.push(i);
                            }
                            return ret;
                        })();
                        $('#tags').tagsInput({
                            use_autocomplete: true,
                            autocomplete: {
                                source: sources
                            },
                            delimiter: ' ',
                            focus: function(input) {
                                input.unbind('keyup');
                                input.bind('keyup', function(event) {
                                    if (event.keyCode == 8) {
                                        var tags = $('#tags').val().split(' ');
                                        tags.pop();
                                        $('#tags_tagsinput .tag').remove();
                                        $('#tags').tagsInput.importTags($('#tags')[0], tags.join(' '));
                                        input.val('');
                                    }
                                });
                            }
                        });
                    }
                }
            });
        };

        // simple validation for required element
        $.each(['title', 'content'], function(i, e) {
            var input = form.find('[name="'+e+'"]');
            if (input.length > 0) {
                input.data('prev_length', 0);
                input.bind('keyup', function(e) {
                    var input = $(this);
                    var l = input.val().length;
                    var prev = input.data('prev_length');
                    if ((prev > 0 && l == 0) || (prev == 0 && l > 0)) {
                        input.closest('form').trigger('validate_on_blur');
                    }
                    input.data('prev_length', l);
                });
            }
        });
        // 最初にvalidationしてしまぁE
        form.data('serialized', '');
        form.trigger('validate_on_blur');
    }
});

JSDoIt.QaQuestion = JSDoIt.QaCreate.extend({
    init: function() {
        log("[QaQuestion][init]");
        // QaCreateとの差刁E
        this.form_id = "#form_answer";
        this.validate_action = "/api/qa/answer/validate";
        this.preview = false;
    },
    domLoaded: function() {
        this._super();

        $('#fork_button').click(function() {
            $('#fork_code').submit();
            return false;
        });
        var dialog_mask = $('#dialog_mask');
        if (dialog_mask.length) {
            var delete_button = $('#dialog_delete_button');
            $('.delete_button').click(function() {
                delete_button.data('target_id', $(this).closest('article').attr('id'));
                dialog_mask.show();
                return false;
            });
            dialog_mask.find('a').click(function() {
                dialog_mask.hide();
                return false;
            });
            delete_button.click(function() {
                var target_id = $(this).data('target_id');
                var m = target_id.match(new RegExp(/^([acq])(\d+)$/));
                if (! (m && m.length == 3)) return;

                var api = {
                    a: { id: 'aid', path: 'answer' },
                    c: { id: 'cid', path: 'comment' },
                    q: { id: 'qid', path: 'question' }
                }[m[1]];
                var data = { token: token };
                data[api.id] = m[2];
                $.post(
                    "/api/qa/" + api.path + "/delete", data, function(data) {
                        console.log(JSON.stringify(data));
                        if (data.result == "ok") {
                            if (m[1] === 'q') {
                                location.href = "/qa";
                            } else {
                                $('#' + target_id).remove();
                            }
                        }
                    }, "json"
                );
            });
        }
        $('.comment_button').click(function(e) {
            e.preventDefault();
            var commentArea = $(this).closest('.action').find('.commentArea');
            if (commentArea.css('display') === 'none') {
                commentArea.show('blind', {}, 'fast');
            } else {
                commentArea.hide('blind', {}, 'fast');
            }
        });
        var forms = $('.formComment').children('form');
        $.each(forms, function (i, form) {
            $(form).submit(function (e) {
                var content = $(this).find(':input[name="content"]').val();
                if (content.length < 1 || content.length > 1000) {
                    return false;
                }
            });
        });
    }
});

JSDoIt.QaEdit = JSDoIt.QaCreate.extend({
    init: function() {
        log("[QaEdit][init]");
        // QaCreateとの差刁E
        this.validate_action = "/api/qa/edit/validate";
    },
    domLoaded: function() {
        this._super();
        $(this.form_id).keyup();
    }
});

JSDoIt.QaAnswer = JSDoIt.QaQuestion.extend({
    init: function() {
        log("[QaQuestion][init]");
        // QaCreateとの差刁E
        this.form_id = "#form_answer";
        this.validate_action = "/api/qa/answer/validate";
        this.preview = false;
    },
    domLoaded: function() {
        this._super();
    }
});

var AceEnv = {};
$(function () {
    AceEnv = {
        catalog : require("pilot/plugin_manager").catalog,
        Dom : require("pilot/dom"),
        Event : require("pilot/event"),
        Editor : require("ace/editor").Editor,
        EditSession : require("ace/edit_session").EditSession,
        UndoManager : require("ace/undomanager").UndoManager,
        Renderer : require("ace/virtual_renderer").VirtualRenderer
    };
    AceEnv.catalog.registerPlugins([ "pilot/index" ]);
    // 他領域選択時にカーソルを消す 
    var selector = '#boxEditJS, #boxEditHTML, #boxEditCSS';
    $(selector).live('click.ace_editor', function () {
        var box = $(this).closest(selector);
        $(selector).not(box).find('.ace_cursor-layer').empty();
    });
});
function create_ace (textarea, option) {
    option = $.extend({}, option);
    var el = $('<div></div>').css({
        "width" : "100%",
        "height" : "100%"
    }).get(0);
    $(textarea).after(el).hide();
    var lang = ({
        'JS' : 'javascript',
        'HTML' : 'html',
        'CSS' : 'css'
    })[$(textarea).closest('.code').attr('id').match(/boxCode(\w+)/).pop()];

    window.require.noWorker = true;
    var self = {};
    self.element = el;
    var base = (function () {
        var val = $(textarea).val();
        var text = $(textarea).text();
        return val.length < text.length ? text : val;
    })();
    self.doc = new AceEnv.EditSession(base || AceEnv.Dom.getInnerText(el));
    self.doc.setUndoManager(new AceEnv.UndoManager());
    self.editor = new AceEnv.Editor(new AceEnv.Renderer(el));
    self.editor.setSession(self.doc);

    self.env = require("pilot/environment").create();
    AceEnv.catalog.startupPlugins({ env: self.env }).then(function() {
        self.env.document = self.doc;
        self.env.editor = self.env;
        self.editor.resize();
        AceEnv.Event.addListener(window, "resize", function() {
            self.editor.resize();
        });
        el.env = self.env;
        var mode = require("ace/mode/"+lang).Mode;
        self.editor.getSession().setMode(new mode());
        if (option.readonly) {
            self.editor.renderer.hideCursor();
            self.editor.setReadOnly(true);
            $(textarea).nextAll('.ace_editor').children('textarea').keydown(function (e) {
                if (e.keyCode !== 13) {
                    return;
                };
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
            });
            if ($.browser.msie && (parseInt($.browser.version) >= 9)) {
                $(el).find('textarea').remove();
            };
            $(el).find('textarea').css({
                'top' : '-1000px',
                'left' : '-1000px',
                'position' : 'absolute',
                'z-index' : -10
            });
        };
    });
    self.getCode = function () {
        return this.doc.getValue();
    };
    self.resize = function () {
        this.editor.renderer.onResize();
    };
    self.bindResize = function () {
        $(this.element).closest('.code').bind('resizeBox', function () {
            self.editor.renderer.onResize();
            setTimeout(function () {
                self.editor.renderer.scrollToX(1);
                self.editor.renderer.scrollToY(1);
            }, 0);
        });
    };
    return self;
};

function create_codemirror (textarea, option) {
    option = $.extend({}, option);
    var el = $('<div></div>').css({
        "width" : "100%",
        "height" : "100%",
        "margin-right" : "-465px"
    }).get(0);
    $(textarea).after(el).hide();
    var lang = ({
        'JS' : 'text/javascript',
        'HTML' : 'text/html',
        'CSS' : 'text/css'
    })[$(textarea).closest('.code').attr('id').match(/boxCode(\w+)/).pop()];
    var self = CodeMirror(el, {
        'value' : textarea.value,
        'lineNumbers' : true,
        'indentWithTabs' : true,
        'indentUnit' : 4,
        'tabMode' : 'classic',
        'matchBrackets' : true,
        'mode' : lang
    });
    self.element = el;
    self.getCode = function () {
        return self.getValue();
    };
    self.resize = function () {
        self.refresh();
    };
    self.bindResize = function () {
        $(this.element).closest('.code').bind('resizeBox', function () {
            self.refresh();
        });
    };
    return self;
};

var time = (new Date).getTime();
basefiles = (typeof(basefiles)=="undefined") ? '' : basefiles;
Editor = Class.extend({
    parserfiles: {
        js:   ["tokenizejavascript.js", "parsejavascript.js"],
        css:  "parsecss.js",
        html: "parsexml.js"
    },
    stylesheets: {
        js:   "/css/codemirror/jscolors.css",
        css:  "/css/codemirror/csscolors.css",
        html: "/css/codemirror/xmlcolors.css"
    },
    default_options: {
        height:             "100%",
        path:               "/js/codemirror/",
        basefiles:          (debug ? ["util.js?t="+time, "stringstream.js?t="+time, "select.js?t="+time, "undo.js?t="+time, "editor.js?t="+time, "tokenize.js?t="+time] : [ basefiles ]), // basefiles from global
        autoMatchParens:    true,
        continuousScanning: false, // 日本語E力できるように(keydownでdelayScanningが動かなぁEぁE)
        lineNumbers:        true,
        lineNumberDelay:    200,
        lineNumberTime:     50
    },
    init: function( _options ) {
        var slf  = this;
        this.textarea = _options.textarea;
        var type = _options["type"];
        delete _options["textarea"];
        delete _options["type"];
        delete _options["box"];

        this.default_options[ "parserfile" ] = this.parserfiles[ type ];
        this.default_options[ "stylesheet" ] = this.stylesheets[ type ];
        var options = $.extend( true, {}, this.default_options, _options );

        if (!this.is_editor()) {
            this.editor = create_ace(this.textarea[0], {
                'readonly' : true
            });
            this.bindResize();
            setTimeout(function () {
                slf.resize();
            }, 0);
            return;
        };
        if ( controller.editor_is_textarea() ) {
            // editor_is_textarea from global
            // onChange: this.onChange
            // cursorActivity: this.onCursorActivity
            var last_value = this.textarea.val();
            this.textarea
                .keydown( function() {
                    options[ "cursorActivity" ]();
                    return true;
                })
                .keyup( function() {
                    var new_value = slf.textarea.val();
                    if ( last_value != new_value ) {
                        last_value = new_value;
                        options[ "onChange" ]();
                    }
                });
        }
        else {
            this.editor = create_codemirror(this.textarea[0]);
            if (_options.default_view) this.editor.focus();
            this.bindResize();
        }
    },
    is_editor: function() {
        return 1;
    },
    resize: function() {
        this.editor.resize();
    },
    bindResize: function() {
        this.editor.bindResize();
    },
    get_code: function() {
        if ( typeof(this.editor) != "undefined" ) {
            return this.editor.getCode();
        }
        else {
            return this.textarea.val();
        }
    },
    set_code: function(code) {
        if ( typeof(this.editor) != "undefined" ) {
            if (controller.editor_is_textarea()) {
                $(this.textarea).val(code);
            } else if (controller.editor_is_ace()) {
                this.editor.editor.session.setValue( code );
                this.editor.editor.renderer.scrollToX(1);
                this.editor.editor.renderer.scrollToY(1);
                this.editor.editor.setReadOnly(true);
                return this;
            } else {
                return this.editor.setValue(code);
            }
        }
        else {
            return this.textarea.val( code );
        }
    },
    get_codemirror_editor: function() {
        return this.editor.editor;
    }
});

Viewer = Editor.extend({
    default_options: {
        height:             "100%",
        path:               "/js/codemirror/",
        basefiles:          (debug ? ["util.js?t="+time, "stringstream.js?t="+time, "select.js?t="+time, "undo.js?t="+time, "editor.js?t="+time, "tokenize.js?t="+time] : [ basefiles ]), // basefiles from global
        autoMatchParens:    false,
        continuousScanning: false,
        lineNumbers:        false,
        lineNumberDelay:    200,
        lineNumberTime:     50,
        readOnly:           true
    },
    init: function( options ) {
        this._super( options );
        if (options.initCallback) options.initCallback();
    },
    is_editor: function() {
        return 0;
    }
});

TabEditor = Class.extend({
    code_container: null,
    tabs: null,
    current_tab_index: 0,
    uid: null,
    init: function( _options ) {
        var tab_editor = this;
        var default_options = {};
        this.options = jQuery.extend( true, default_options, _options );

        var form = $("#code_form")[0];
        this.uid   = form.uid.value;

        this.code_container = this.options.box;
        delete _options["box"];
        delete _options["readOnly"];

        this.tabs = new Array;
        $(".tab" + this.options.type.toUpperCase() )
            .each( function( index) {
                var tab = $(this);
                if ( tab.hasClass("initialTab") ) {
                    tab.data( "loaded", true );
                    var _editor = new Editor( _options );
                    if (controller.editor_is_ace()) {
                        _editor.resize();
                        _editor.bindResize();
                    };
                    tab.data( "editor", _editor );
                    tab_editor.editor = _editor.editor;
                }
                else {
                    tab.data( "loaded", false );
                    tab.data( "href", initial_tabs[ tab_editor.options.type ][index] ); // from global
                }
                var codes = tab_editor.code_container.find(".editorBox");
                tab.data( "code",  $(codes[index]) );
                tab.data( "index", index );
                tab_editor.tabs.push( tab );
            })
            .live("click", function(ev) {
                log("[click]",ev);
                tab_editor.select_tab( $(this) );
            })
            .find(".close")
                .live("click", function(ev) {
                    log( "[close click]",ev);
                    if ( ! confirm( l('confirm_close_tab') ) ) { return; }

                    tab_editor.close_tab( $(this).parent("li") );
                    return false;
                });
    },
    add_tab: function( title, href ) {
        var initial_tab = this.tabs[0];
        var tab = initial_tab.clone()
            .removeAttr("id")
            .removeClass("selected")
            .removeClass("initialTab")
            .insertAfter( initial_tab );
        tab.attr("title",title);
        tab.children().first()
            .text( title );
        var code = $("<div class='editorBox'><div class='transparent'><img src='/img/spacer.gif' /></div><textarea>// loading...</textarea></div>")
            .appendTo( this.code_container );
        var next_index = this.tabs.length;
        tab.data( "code",   code );
        tab.data( "loaded", false );
        tab.data( "href",   href );
        tab.data( "index",  next_index );
        this.tabs.push( tab );
        //this.select_tab_by_index( next_index ); // dont jump, because js libraries are heavy
    },
    current_tab: function() {
        return this.tabs[ this.current_tab_index ];
    },
    select_tab_by_index: function( index ) {
        this.select_tab( this.tabs[ index ] );
    },
    select_tab: function( tab ) {
        this.current_tab().removeClass("selected");
        this.current_tab().data("code").hide();
        tab.addClass("selected");
        tab.data("code").show();

        this.current_tab_index = tab.data("index");
        if ( tab.data("loaded") == false ) {
            // tbd
            this.load_tab( tab );
        }
        if (controller.editor_is_ace()) {
            tab.data("editor").editor.editor.renderer.onResize();
        };
    },
    load_tab: function( tab ) {
        var slf = this;
        var textarea = tab.data("code").find("textarea");
        tab.data( "loaded", true );
        tab.data( "editor", new Viewer({
            textarea: textarea,
            type: slf.options.type,
            initCallback: function() {
                var load_from = tab.data("href") +"/"+ slf.options.type;
                $.get( load_from, function(data, textStatus) {
                    tab.data( "editor" ).set_code( data );
                }, "text");
            }
        }) );
    },
    close_tab: function( tab ) {
        var code  = tab.data("code");
        var index = tab.data("index");
        var href  = tab.data("href");

        // POST API
        $.post( "/api/code/ref/delete/" + this.options.type, {
            pathname:   href,
            uid:        this.uid
        }, function(data) {
            log("/api/code/ref/delete res: ",data);
            controller.logger.log("Removed Library.");
            controller.reload_iframe();
        }, "json" );

        code.remove();
        tab.removeData();
        tab.remove();
        this.tabs.splice( index, 1 );

        // indexのつじつまを合わせ
        for ( var i=index; i<this.tabs.length; i++ ) {
            this.tabs[ i ].data( "index", i );
        }

        this.current_tab_index = 0;
        this.select_tab_by_index( 0 );
    },
    get_primary_code: function() {
        return this.tabs[0].data("editor").get_code();
    },
    get_all_tab_href: function() {
        return $.map(this.tabs, function (tab) {
            return $(tab).data("href");
        });
    },
    clear_hilight: function() {
        this.code_container.find(".hilightWarning").removeClass("hilightWarning");
        this.code_container.find(".hilightError")  .removeClass("hilightError");
        this.lines().unbind();
    },
    lines: function() {
        if ( this._lines ) { return this._lines; }
        return this._lines = this.code_container.find(".CodeMirror-line-numbers").first().children();
    },
    hilight: function( row_number, text ) {
        // "#boxCodeJS .CodeMirror-line-numbers").first().children(":eq(6)").addClass("error")
        var lines = this.lines();
        var type  = text.match( /error/i ) ? "Error" : "Warning";
        lines.eq( row_number-1 )
            .addClass("hilight" + type)
            .hover( function() {
                var $linemarker = $(this);
                var offset = $linemarker.offset();
                $("#hilightMessage")
                    .show()
                    .removeClass("hilightWarning hilightError")
                    .addClass("hilight" + type)
                    .text( text )
                    .css({
                        left: $linemarker.width() + "px",
                        top:  $linemarker.height() + offset.top+"px"
                    })
            }, function() {
                $("#hilightMessage").hide();
            });
    },
    get_codemirror_editor: function() {
        return this.tabs[0].data("editor").editor.editor;
    }
});

TabViewer = TabEditor.extend({
    init: function( _options ) {
        var tab_viewer = this;
        var default_options = {};
        this.options = jQuery.extend( true, default_options, _options );

        this.code_container = this.options.box;
        delete _options["box"];

        this.tabs = new Array;
        $(".tab" + this.options.type.toUpperCase() )
            .each( function( index) {
                var tab = $(this);
                if ( tab.hasClass("initialTab") ) {
                    tab.data( "loaded", true );
                    tab.data( "editor", new Viewer( _options ) );
                }
                else {
                    tab.data( "loaded", false );
                    tab.data( "href", initial_tabs[ tab_viewer.options.type ][index] ); // from global
                }
                var codes = tab_viewer.code_container.find(".editorBox");
                tab.data( "code",  $(codes[index]) );
                tab.data( "index", index );
                tab_viewer.tabs.push( tab );
            })
            .live("click", function(ev) {
                log("[click]",ev);
                tab_viewer.select_tab( $(this) );
            })
    }
});

Logger = Class.extend({
    $: null,
    init: function( selector ) {
        var logger = this;
        this.$ = $( selector );
        this.clear();
        $(window).resize( function(ev) { logger.resize(); } );
    },
    log: function( text ) {
        this.$.text( text + "\n" + this.$.text() );
    },
    clear: function() {
        this.$.text( '' );
    },
    resize: function() {
        // 下かめE0pixel, 上からE距離はそEまま, padding合訁E 12px
        var height = $(window).height() - 40 - this.$.position().top - 12;
        height     = (height<100) ? 100 : height;
        this.$.height( height );
    }
});

ActivityWatcher = Class.extend({
    timer: null,
    callback: null,
    init: function( idle_milliseconds, callback ) {
        this.callback          = callback;
        this.idle_milliseconds = idle_milliseconds;
    },
    start_timer: function() {
        var slf = this;
        this.stop_timer();
        this.timer = setTimeout( function() {
            slf.timer = null;
            slf.callback();
        }, this.idle_milliseconds );
    },
    reset_timer: function() {
        if ( this.timer ) {
            this.start_timer();
        }
    },
    stop_timer: function() {
        if ( this.timer ) {
            clearTimeout( this.timer );
            this.timer = null;
        }
    }
});

var router = new PathRouter( path || 'action', "JSDoIt" );
$(function() {
    router.dispatch( "domLoaded" );

    if ( $.fn.meca ) {
        // ロールオーバE
        $('.btn').meca('hover');

        // 高さ揁E
        $('.groupLeveled').meca('heightAlign');
    };
    // footer
    $("#kayacProjectTrigger").click( function(){
        $("#boxKayacLink").slideToggle();
    });
    $('#navGlobalSearch form').submit(function (e) {
        e.preventDefault();
        var self = $(this);
        var val = self.find(':text').val();
        var url = self.attr('action') + '#' + encodeURIComponent(val);
        self.attr('action', url);
        location.href = url;
        if (location.pathname === '/search') {
            location.reload();
        };
    });
});
$(window).load( function() {
    router.dispatch("loaded");

    if ( $.fn.meca ) {
        // 外部リンク(遁Eせる)
        $('a.external, [rel~="external"]').meca('external');
    }
});
router.dispatch( "beforeBodyLoaded" );
