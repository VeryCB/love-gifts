/*
* jQuery Color Animations
* Copyright 2007 John Resig
* Released under the MIT and GPL licenses.
*/
(function(e){function g(c){var a;if(c&&c.constructor==Array&&c.length==3)return c;if(a=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(c))return[parseInt(a[1]),parseInt(a[2]),parseInt(a[3])];if(a=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(c))return[parseFloat(a[1])*2.55,parseFloat(a[2])*2.55,parseFloat(a[3])*2.55];if(a=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(c))return[parseInt(a[1],16),parseInt(a[2], 16),parseInt(a[3],16)];if(a=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(c))return[parseInt(a[1]+a[1],16),parseInt(a[2]+a[2],16),parseInt(a[3]+a[3],16)];return i[e.trim(c).toLowerCase()]}e.each(["backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","color","outlineColor"],function(c,a){e.fx.step[a]=function(b){if(b.state==0){var d;d=b.elem;var h=a,f;do{f=e.curCSS(d,h);if(f!=""&&f!="transparent"||e.nodeName(d,"body"))break;h="backgroundColor"}while(d=d.parentNode); d=g(f);b.start=d;b.end=g(b.end)}b.elem.style[a]="rgb("+[Math.max(Math.min(parseInt(b.pos*(b.end[0]-b.start[0])+b.start[0]),255),0),Math.max(Math.min(parseInt(b.pos*(b.end[1]-b.start[1])+b.start[1]),255),0),Math.max(Math.min(parseInt(b.pos*(b.end[2]-b.start[2])+b.start[2]),255),0)].join(",")+")"}});var i={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0, 100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128, 128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);

$.fn.uploader = function(opt) {
    var opt = $.extend({
        action:      null,
        name:        'upload_image',
        post_data:   {},
        data_type:   '',
        form_style:  {},
        submit_handler: function() {},
        mouseover_handler: function() {},
        mouseout_handler:  function() {}
    }, opt);

    var form_style = $.extend({
        display:  'block',
        position: 'absolute',
        zIndex:   2147483583
    }, opt.form_style );

    if (!opt.action) {
        throw new Error('action is required');
    }

    var target  = 'image_uploader_submit_target';
    var body    = $('body');
    var post_data = $('<div>');;
    $.each(opt.post_data, function(name, value) {
        var data = $('<input>').attr({
            type:  'hidden',
            name:  name,
            value: value
        });
        post_data.append(data);
    });

    return this.each(function() {
        var self   = $(this);
        var form   = $('<form>');
        var iframe = $('<iframe>');

        iframe.attr({ name: target }).css({ 
            visibility: 'hidden',
            width:      0,
            height:     0
        })
        .bind('load', function() {
            var response = iframe.contents().find('body').text();
            if (response) {
                if (opt.data_type.toLowerCase() == 'json') {
                    response = eval('(' + response + ')');
                }
                opt.submit_handler.call(self.get(0), response);
                resize();
            }
            form.removeClass("uploading");
        });
        body.append(iframe);

        form
            .attr({
                enctype: 'multipart/form-data',
                method:  'post',
                target:  target,
                action:  opt.action
            })
            .addClass("image-uploader-form")
            .css( form_style );

        var input = self.clone()
            .bind('mouseover', function(e) {
                opt.mouseover_handler.call(self.get(0), e);
            })
            .bind('mouseout', function(e) {
                opt.mouseout_handler.call(self.get(0), e);
            })
            .bind('change', function(e) {
                opt.change_handler.call(self.get(0), e);
                form.addClass("uploading");
                form.submit();
                return true;
            });
        function resize() {
            var offset = self.offset();
            form.css({ left: parseInt(offset.left), top: parseInt(offset.top) }); // なんかガタガタするからparseIntしとく
        }
        $(window).resize( resize );

        self.css({ visibility: 'hidden' });

        form
            .append(post_data)
            .append(input);
        if ( opt.append_more ) {
            form.append( opt.append_more );
        }
        form.offset( self.offset() );

        body.append(form);
    });
};

/* http://ejohn.org/blog/simple-javascript-inheritance/ */
// some comments added by @maaash
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
    this.Class = function(){};
    Class.extend = function(prop) {
        var _super = this.prototype;
        initializing = true;
        var prototype = new this(); // 親クラスをinit呼ばずにnewする
        initializing = false;
        for (var name in prop) {
            prototype[name] = typeof prop[name] == "function" &&
             typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){    // fake _super() for all functions in prop which calls '_super', leave functions which doesnt call '_super'
                    return function() {
                        var tmp = this._super;
                        this._super = _super[name];
                        var ret = fn.apply(this, arguments);       
                        this._super = tmp;          
                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }
        function Class() {
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }
        Class.prototype = prototype;
        Class.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
})();

// localization
var rules = {
    confirm_running_danger_code: {
        ja: 'このコードの実行は危険な可能性があるとユーザーに指摘されています。コードをよく読んでから実行してください。実行してもよろしいですか？',
        en: 'Running this code is reported Danger by jsdo.it users, read the code before running this. Do you really want to run this?'
    },
    confirm_close_tab: {
        ja: 'タブを削除します。よろしいですか？',
        en: 'Really close tab?'
    },
    invalid_path: {
        ja: 'アルファベット、または[-._]のいずれかをお使いください',
        en: 'Use alphabet or "-",".","_"'
    },
    following: {
        ja: 'フォロー済',
        en: 'following'
    },
    favorited: {
        ja: 'お気に入りに追加済',
        en: 'add to favorites'
    },
    unfollow_confirm: {
        ja: 'このユーザーをフォロー解除します\nよろしいですか？',
        en: 'Really unfollow this user ?'
    },
    choose_image: {
        ja: '500kB以内の画像ファイルを選択してください',
        en: 'Choose Image Files up to 500kB'
    },
    code_delete_confirm: {
        ja: 'コードを削除します\nよろしいですか？',
        en: 'Really delete code ? This cant be undone.'
    },
    favorite_delete_confirm: {
        ja: 'お気に入りを削除します\nよろしいですか？',
        en: 'Really delete your favorite ? This cant be undone.'
    },
    unload_confirm: {
        ja: '編集ページから離れます\nよろしいですか？',
        en: 'Really leave edit page?'
    },
    account_identifier_delete_confirm: {
        ja: 'このIDと現在のアカウントの連携を解除します\nよろしいですか？',
        en: 'Really disable this id to sign in as current account?'
    },
    code_talk_textarea_prompt_message: {
        ja: 'コードへの質問、作者へのメッセージなどを記入してください\n例：このセレクタの指定はどういう意味ですか？\n　　 この書き方は知りませんでした',
        en: 'Got a question? or leave a message to the creator?'
    }
};
function l( key ) {
    var patterns = rules[ key ];
    if ( ! patterns ) { return ''; }

    var ret = patterns[ language ];
    if ( ret ) {
        return ret;
    }
    else {
        return patterns[ 'en' ];
    }
}

jQuery.fn.find_note = function(str) {
    var found = this.parent().parent().find('.txtError');
    if ( found.length ) {
        return found;
    }
    else {
        // 無ければ１つ上の階層から探す
        return found.end().parent().find('.txtError');
    }
}
jQuery.fn.restore_note = function() {
    if ( this.data('default_note') ) {
        var note_el = $(this).find_note();
        if ( note_el.html() != this.data('default_note') ) {
            // 過去に一度set_noteされていて、今default_noteになっていない場合のみsetする
            note_el.html( this.data('default_note') );
        }
    }
    return this;
}
jQuery.fn.set_note = function(str) {
    var note_el = this.find_note();
    if ( ! this.data('default_note') ) {
        this.data( 'default_note', note_el.html() );
    }
    if (! $(this).hasClass('preventErrorMessage')) {
        note_el.html( str );
    }
    return this;
}
jQuery.fn.clear_note = function() {
    var note_el = this.find_note();
    if ( ! this.data('default_note') ) {
        this.data( 'default_note', note_el.html() );
    }
    note_el.html( '' );
    return this;
}
jQuery.fn.find_box_form = function() {
    var boxerror = this.parent(".boxForm");
    if ( boxerror.length ) {
        return boxerror;
    }
    else {
        // /account/nameではこうなる...
        return this.find(".boxForm");
    }
}
jQuery.fn.clear_errors = function() {
    // formタグに対して呼ぶ
    var inputs = this.find('input');
    inputs.clear_note();
    inputs.parent().parent('dl')
        .removeClass('listError');
    this.find_box_form()
        .removeClass("boxError");
    this.find(".allError")
        .hide()
        .text("");
}
jQuery.fn.hilight_errors = function( errors ) {
    // formタグに対して呼ぶ
    var inputs = this.find(':input');

    this.find_box_form().addClass("boxError");

    var error;
    if ( errors["all"] ) {
        error = (typeof errors["all"] == "object") ? errors["all"].join('') : errors["all"];
        this
            .find(".allError")
            .show()
            .text( error );
        delete errors["all"];
    }
    inputs.parent().parent('dl')
        .removeClass('listError'); // 一度消してから
    for( var key in errors ) {
        error = (typeof errors[key] == "object") ? errors[key].join('') : errors[key];
        inputs.filter("[name='"+key+"']")
            .set_note( error )
            .parent().parent('dl')
            .addClass('listError');
    }
}

// form validator
jQuery.fn.activate_form_validator = function( _config ) {
    log('[activate_form_validator]config: ',_config," this: ",this);

    var form = this;
    var ACTION_VALIDATE_ONLY                 = 1;
    var ACTION_VALIDATE_TO_SUBMIT_AJAX       = 2;
    var ACTION_VALIDATE_TO_SUBMIT_TRANSITION = 3;
    var ACTION_SUBMIT_AJAX                   = 4;
    var _action = form.attr('action') || location.pathname;
    var default_config = {
        validate_on_blur:   1,
        validate_on_submit: 1,
        validate_on_keyup:  0,
        transition:         true, // validation後にform.submitして画面遷移する
        action:             _action,
        validate_action:    (_action.match('^/api/') ? '' : '/api') + _action + '/validate',
        on_error:           null,
        on_ok:              null
    };
    var config = jQuery.extend( {}, default_config, _config );

    form.data('serialized', form.serialize() );

    if ( config.validate_on_submit ) {
        form.submit( function(ev) {
            if ( config["transition"] && form.data("validationOK") ) {
                form.data('validationOK', false);
                return true;
            }
            var action;
            if ( config["transition"] ) {
                action = ACTION_VALIDATE_TO_SUBMIT_TRANSITION;
            }
            else if ( form.data("validationOK") ) {
                action = ACTION_SUBMIT_AJAX;
            }
            else {
                action = ACTION_VALIDATE_TO_SUBMIT_AJAX;
            }
            form.data("validationOK",false);
            do_action( action );
            return false;
        });
    }

    if ( config.validate_on_blur ) {
        form.live( 'blur', function(ev) {
            $(this).trigger('validate_on_blur');
        });
        form.bind('validate_on_blur', function(ev) {
            do_action( ACTION_VALIDATE_ONLY );
        });
    }

    if ( config.validate_on_keyup ) {
        form.live( 'keyup', function(ev) {
            // 連打対策
            if ( form.data("timer_validator") ) {
                clearTimeout( form.data("timer_validator") );
            }
            var timer = setTimeout( function() {
                form.data("timer_validator", false);
                do_action( ACTION_VALIDATE_ONLY );
            }, 400 );
            form.data("timer_validator",timer);
        });
    }

    function do_action( action_type ) {
        var last_serialized    = form.data('serialized');
        var current_serialized = form.serialize();
        form.data('serialized', current_serialized );

        if ( (action_type == ACTION_VALIDATE_ONLY) && last_serialized && (last_serialized == current_serialized) ) {
            return; // 変化が無ければvalidateしない, submitイベントでは変化が無くても一応validationする
        }

        form.addClass("validating");

        var action = ((action_type == ACTION_VALIDATE_ONLY) || (action_type == ACTION_VALIDATE_TO_SUBMIT_AJAX) || (action_type == ACTION_VALIDATE_TO_SUBMIT_TRANSITION)) ? config["validate_action"] : config["action"];
        $.post(
            action,
            current_serialized,
            function(data) {
                log("action: "+action+" res: ",data);

                form.removeClass("validating")
                    .removeClass("valid");

                var inputs = form.find('input');
                if (!data) return;
                if ( data.result == "ok" ) {
                    form.clear_errors();
                    form.addClass("valid");
                    
                    if ( (action_type == ACTION_VALIDATE_TO_SUBMIT_AJAX) || (action_type == ACTION_VALIDATE_TO_SUBMIT_TRANSITION) ) {
                        form.data('validationOK', true);
                        form.submit();
                    }
                    if ( (action_type == ACTION_SUBMIT_AJAX) && config["callback"] ) {
                        config["callback"]( data );
                    }
                    if (config["on_ok"]) {
                        config["on_ok"](data);
                    }
                }
                else {
                    form.clear_errors();
                    form.hilight_errors( data.error );
                    if ( config["on_error"] ) {
                        config["on_error"]( data );
                    }
                }
            },
            "json"
        );
    }
}

// inplace editor
jQuery.fn.activate_inplace_editor = function( _config ) {
    var slf = this;
    var default_config = {
        validator_config: {
            transition: false
        },
        toggle_target:  null,
        form:           null
    };
    var config = jQuery.extend( true, default_config, _config );

    this.click( function(ev) { 
        config["toggle_target"].toggle();
        if ( ! slf.data("activated") && config["onActivate"] ) {
            slf.data("activated", true);
            config["onActivate"]();
        }
        return false;
    });
    if ( config["cancel"] ) {
        config["cancel"].click( function() {
            config["toggle_target"].toggle();
            return true; // do reset
        });
    }
    config["form"].activate_form_validator( config.validator_config );
}

jQuery.fn.activate_smart_candidates = function( _config ) {
    var delimiter  = ' ';
    var candidates = _config["candidates"];
    var slf        = this;

    candidates.live( "click", function(ev) {
        var input          = $(this);
        var clicked        = input.text();
        var current_inputs = $.grep( slf.val().split( delimiter ), function(val,index) { return val; } ); // 空白除去
        if ( ! $.grep( current_inputs, function(val,index) { return val == clicked; } ).length ) {
            // まだinputに入ってなければ
            current_inputs.push( clicked );
            slf.val( current_inputs.join(' ') );
        }
        return false;
    });
}

jQuery.fn.inputPrompt = function(text) {
    var options = {
        className: 'input-prompt'
    };

    var focus = function() {
        var input = $(this);
        if (!input.data('edited'))
            input.val('');
        input.removeClass(options.className);
    };

    var blur = function() {
        var input = $(this);
        if (input.val() == '')
            input.data('edited', false)
            .addClass(options.className)
            .val(input.data('prompt'));
        else
            input.data('edited', true);
    };

    var clean = function() {
        var input = $(this);
        if (!input.data('edited'))
            input.val('');
    };

    return this.each(function() {
        var input = $(this);
        input.data('prompt', text)
            .focus(focus)
            .blur(blur)
            .blur()
            .keyup( function(){ input.data('edited',true); } )
            .parents('form')
                .submit(clean_handler);
        $(window).unload(clean_handler); // safari keeps input value

        function clean_handler() {
            clean.call(input);
        }
    });
};

/*
config: {
  input:        $("#path")
}
*/
jQuery.fn.lock = function( config ) {
    var button  = this;
    var input   = config.input;
    var message = $("#balloonLockUrl");
    function dolock () {
        input
            .attr("readonly",true)
            .addClass("readonly");
        button.removeClass("unlock");
        button.addClass("lock");

        return false;
    }
    function unlock () {
        input
            .removeAttr("readonly")
            .removeClass("readonly");
        button.removeClass("lock");
        button.addClass("unlock");
        return false;
    }
    dolock();
    button
        .toggle( unlock, dolock )
        .hover( function(){ message.show(); }, function(){ message.hide(); } );
}

// copied from $.ui.draggable, and modified, to trigger('update') to update position
if ( $.ui && $.ui.draggable ) {
    $.extend($.ui.draggable.prototype, {
	    _mouseDrag: function(event, noPropagation) {

		    //Compute the helpers position
		    this.position    = this._generatePosition(event);
		    this.positionAbs = this._convertPositionTo("absolute");

		    //Call plugins and callbacks and use the resulting position if something is returned
		    if (!noPropagation) {
			    var ui = this._uiHash();
			    if(this._trigger('drag', event, ui) === false) {
				    this._mouseUp({});
				    return false;
			    }
			    this.position = ui.position;
		    }

            this._trigger('update', event, ui);

		    return false;
	    }
    });
}

/*

	jQuery Tags Input Plugin 1.2
	
	Copyright (c) 2010 XOXCO, Inc
	
	Documentation for this plugin lives here:
	http://xoxco.com/clickable/jquery-tags-input
	
	Licensed under the MIT license:
	http://www.opensource.org/licenses/mit-license.php

	ben@xoxco.com

*/

(function($) {

	var delimiter = new Array();
	
	jQuery.fn.addTag = function(value,options) {
		
			var options = jQuery.extend({focus:false},options);
			this.each(function() { 
				id = $(this).attr('id');
	
				var tagslist = $(this).val().split(delimiter[id]);
				if (tagslist[0] == '') { 
					tagslist = new Array();
				}
				value = jQuery.trim(value);
				if (value !='') {
                    // click function
                    // 2011-04-19 sugyan
                    var tagspan = $('<span class="tag">'+$('<span>').text(value).html() + '&nbsp;&nbsp;<a href="#" title="Remove tag">x</a></span>').insertBefore('#'+id+'_addTag');
                    tagspan.find('a').click(function(e) {
                        return $('#'+id).removeTag(escape(value));
                    });
					tagslist.push(value);
				
					$('#'+id+'_tag').val('');
					if (options.focus) {
						$('#'+id+'_tag').focus();
					} else {		
						$('#'+id+'_tag').blur();
					}
				}
				jQuery.fn.tagsInput.updateTagsField(this,tagslist);
		
			});		
			
			return false;
		};
		
	jQuery.fn.removeTag = function(value) { 

			this.each(function() { 
				id = $(this).attr('id');
	
				var old = $(this).val().split(delimiter[id]);
	
				
				$('#'+id+'_tagsinput .tag').remove();
				str = '';
				for (i=0; i< old.length; i++) { 
					if (escape(old[i])!=value) { 
						str = str + delimiter[id] +old[i];
					}
				}
				jQuery.fn.tagsInput.importTags(this,str);
			});
					
			return false;
	
		};
	
	
	jQuery.fn.tagsInput = function(options) { 
	
		var settings = jQuery.extend({defaultText:'add a tag',width:'300px',height:'100px','hide':true,'delimiter':',',autocomplete:{selectFirst:false}},options);
	
		this.each(function() { 
			if (settings.hide) { 
				$(this).hide();				
			}
				
			id = $(this).attr('id')
			
			data = jQuery.extend({
				pid:id,
				real_input: '#'+id,
				holder: '#'+id+'_tagsinput',
				input_wrapper: '#'+id+'_addTag',
				fake_input: '#'+id+'_tag'
			},settings);
	
	
			delimiter[id] = data.delimiter;
	
			$('<div id="'+id+'_tagsinput" class="tagsinput"><div id="'+id+'_addTag"><input id="'+id+'_tag" value="" default="'+settings.defaultText+'" /></div><div class="tags_clear"></div></div>').insertAfter(this);
	
			$(data.holder).css('width',settings.width);
			$(data.holder).css('height',settings.height);
	
		
			if ($(data.real_input).val()!='') { 
				jQuery.fn.tagsInput.importTags($(data.real_input),$(data.real_input).val());
			} else {
				$(data.fake_input).val($(data.fake_input).attr('default'));
				$(data.fake_input).css('color','#666666');				
			}
		
	
			$(data.holder).bind('click',data,function(event) {
				$(event.data.fake_input).focus();
                // enable "focus" callback option
                // 2011-04-19 sugyan
                settings.focus($(event.data.fake_input));
			});
		
			// if user types a comma, create a new tag
			$(data.fake_input).bind('keypress',data,function(event) { 
				if (event.which==event.data.delimiter.charCodeAt(0) || event.which==13) { 
				
					$(event.data.real_input).addTag($(event.data.fake_input).val(),{focus:true});
					return false;
				}
			});
					
			
			$(data.fake_input).bind('focus',data,function(event) {
				if ($(event.data.fake_input).val()==$(event.data.fake_input).attr('default')) { 
					$(event.data.fake_input).val('');
				}
				$(event.data.fake_input).css('color','#000000');		
			});

            // enable autocomplete by "use_autocomplete" option
            // 2011-04-19 sugyan
			if (settings.use_autocomplete) {
                $(data.fake_input).autocomplete(settings.autocomplete).bind('result',data,function(event,data,formatted) {
					if (data) {
						d = data + "";	
						$(event.data.real_input).addTag(d,{focus:true});
					}
				});;
				
		
				$(data.fake_input).bind('blur',data,function(event) { 
					if ($(event.data.fake_input).val() != $(event.data.fake_input).attr('default')) {
						$(event.data.real_input).addTag($(event.data.fake_input).val(),{focus:false});						
					}

					$(event.data.fake_input).val($(event.data.fake_input).attr('default'));
					$(event.data.fake_input).css('color','#666666');
					return false;
				});
	
		
			} else {
	
					// if a user tabs out of the field, create a new tag
					// this is only available if autocomplete is not used.
					$(data.fake_input).bind('blur',data,function(event) { 
						var d = $(this).attr('default');
						if ($(event.data.fake_input).val()!='' && $(event.data.fake_input).val()!=d) { 
							event.preventDefault();
							$(event.data.real_input).addTag($(event.data.fake_input).val(),{focus:true});
						} else {
							$(event.data.fake_input).val($(event.data.fake_input).attr('default'));
							$(event.data.fake_input).css('color','#666666');
						}
						return false;
					});
			
			}
			
			$(data.fake_input).blur();
		});
			
		return this;
	
	};
	
	
	jQuery.fn.tagsInput.updateTagsField = function(obj,tagslist) {
		
			id = $(obj).attr('id');
			$(obj).val(tagslist.join(delimiter[id]));
		};
	
	
	
	jQuery.fn.tagsInput.importTags = function(obj,val) {
			
			$(obj).val('');
			id = $(obj).attr('id');
			var tags = val.split(delimiter[id]);
			for (i=0; i<tags.length; i++) { 
				$(obj).addTag(tags[i],{focus:false});
			}
		};
			
})(jQuery);


/*
 * simple time ago like facebook.
 * Copyright (c) Kazuhiro Osawa
 * licensed under the MIT.
 */
/*
 * usgae
 *
 * var string = simpleTimeago(epoch_time[, format_name]) // format_name: default is 'en'
 *
 * setSimpleTimeagoFormat(format_name, format_obj);
 *
 * var obj = getSimpleTimeagoFormat (format_name);
 *
 */
(function(window) {
	var formats = {};

	window.setSimpleTimeagoFormat = function(name, obj) {
		formats[name] = obj;
	};

	window.getSimpleTimeagoFormat = function(name) {
		return formats[name];
	};

	function toText(tmpl, conf, durations, date) {
		var callee = conf[tmpl];
		if (callee === undefined) {
			return date.toGMTString();
		}
		if (typeof callee === "function") {
			return callee(conf, durations, date);
		} else {
			return callee;
		}
	}
	
	window.simpleTimeago = function(epoch, format) {
		if (format === undefined) {
			format = "en";
		}
		var now     = Math.ceil(new Date().getTime() / 1000);
		var seconds = now - epoch;
		var minutes = Math.ceil(seconds / 60);
		var hours   = Math.ceil(minutes / 60);
		var days    = Math.ceil(hours / 24);
		var years   = Math.ceil(days / 365);
		var date = new Date();
		date.setTime(epoch * 1000);

		var durations = {
			seconds: seconds,
			minutes: minutes,
			hours: hours,
			days: days,
			years: years
		};

		var conf = window.getSimpleTimeagoFormat(format) || {};

		var str =
			seconds < 60 && toText("seconds", conf, durations, date) ||
			minutes < 60 && toText("minutes", conf, durations, date) ||
			hours < 24 && toText("hours", conf, durations, date) ||
			days < 7 && toText("weeks", conf, durations, date) ||
			days < 30 && toText("days", conf, durations, date) ||
			days < 365 && toText("months", conf, durations, date) ||
			toText("years", conf, durations, date);

		return str;
	};

	// add en
	(function(fmt) {
		var o = {};

		o.getTime = function(date) {
			var hour = date.getHours();
			if (hour === 0) {
				hour = 24;
			}
			var minutes = date.getMinutes();
			if (minutes < 10) {
				minutes = "0" + minutes;
			}
			if (hour < 13) {
				return hour + ":" + minutes + "am";
			} else {
				return (hour - 12) + ":" + minutes + "pm";
			}
		};

		o.monthNames = [
			"January", "February", "March",
			"April", "May", "June",
			"July", "August", "September",
			"October", "November", "December"
		];
		o.getDate = function(date) {
			return o.monthNames[date.getMonth()] + " " + date.getDate();
		};

		o.seconds = function(c, d, date) {
			if (d.seconds < 5) {
				return "just now";
			} else if (d.seconds < 30) {
				return "a few seconds ago";
			}
			return d.seconds + " seconds ago";
		};
		o.minutes = function(c, d, date) {
			if (d.minutes === 1) {
				return "about a minute ago";
			}
			return d.minutes + " minutes ago";
		};
		o.hours = function(c, d, date) {
			if (d.hours === 1) {
				return "about an hour ago";
			}
			return d.hours + " hours ago";
		};
		o.days = function(c, d, date) {
			var str = o.getDate(date);
			if (new Date().getFullYear() - date.getFullYear() > 0) {
				str += ", " + date.getFullYear();
			}
			return str + " at " + o.getTime(date);
		};

		o.weeks = function(c, d, date) {
			if (new Date().getDate() - date.getDate() === 1) {
				return "Yesterday at " + o.getTime(date);
			} else {
				return o.days(c, d, date);
			}
		};
		o.months = o.years = o.days;

		fmt("en", o);
	})(window.setSimpleTimeagoFormat);

	// add ja
	(function(fmt) {
		var o = {};

		o.getTime = function(date) {
			var hour = date.getHours();
			var minutes = date.getMinutes();
			if (minutes < 10) {
				minutes = "0" + minutes;
			}
			return hour + "時" + minutes + "分";
		};

		o.monthNames = [];
		o.getDate = function(date) {
			return (date.getMonth() + 1) + "月" + date.getDate() + "日";
		};

		o.seconds = function(c, d, date) {
			if (d.seconds < 5) {
				return "たった今";
			}
			return d.seconds + "秒前";
		};
		o.minutes = function(c, d, date) {
			return d.minutes + "分前";
		};
		o.hours = function(c, d, date) {
			return d.hours + "時間前";
		};
		o.days = function(c, d, date) {
			var str = o.getDate(date);
			if (new Date().getFullYear() - date.getFullYear() > 0) {
				str = date.getFullYear() + "年" + str;
			}
			return str + " " + o.getTime(date);
		};

		o.weeks = function(c, d, date) {
			if (new Date().getDate() - date.getDate() === 1) {
				return "昨日の" + o.getTime(date);
			} else {
				return o.days(c, d, date);
			}
		};
		o.months = o.years = o.days;

		fmt("ja", o);
	})(window.setSimpleTimeagoFormat);

})(window);
