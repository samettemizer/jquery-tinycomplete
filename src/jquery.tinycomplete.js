/*!
 * jquery.tinycomplete [ https://github.com/nestisamet/jquery.tinycomplete ]
 * requires jquery.scrollintoview [https://github.com/litera/jquery-scrollintoview]
 * 
 * Copyright 2014 stemizer.net ~ info<a>stemizer<d>net
 * Licensed under the MIT license
 * http://opensource.org/licenses/mit
 */

(function ($) {
	$.fn.tinycomplete = function(vars) {
		var defaults = {
			type    : 'combo',	// or list
			enterkey : false,
			minlen  : 2,
			requestmethod : 'post', // or 'get'
			requesturl    : null,
			requestkey    : null,
			responsetype  : 'json', // or 'html'
			itemclass      : 'tc-item',
			hiddenobj      : 'tc-hidden',
			itemoperations : 'tc-item-operations',
			callback  : null
		};
		var options = $.extend({}, defaults, vars);
		function TC(obj)
		{
			var self = this;
			var wrapper, container, e_target
			,disabled = false;
			function close() {
				if (options.type!="list")
					container.slideUp('fast');
			};
			obj.addClass("tc-obj")
			.attr("autocomplete","off")
			.keydown(function(e) {
				if (container) {
					if ((e.keyCode===9 || e.keyCode===13) && container.is(":visible")) {
						$(".item-active:first",container).click()
						.removeClass("item-active");
						if (e.keyCode==13) return false;
					}
					if (!options.enterkey && e.keyCode===13) {
						container.slideDown(function() {
							self.deactivate();
							$(this).children().first().addClass("item-active")
							.scrollintoview();
						});
						return false;
					}
					else if (e.keyCode === 38) {
					   container.show();
					   var nextchild = $(".item-active", container).index() - 1;
					   if (nextchild < 0) nextchild = container.children().length - 1;
					   container.children().removeClass("item-active");
					   container.children().eq(nextchild).addClass("item-active");
					   if (options.type == "list")
						   container.children().eq(nextchild).click();
					   container.children().eq(nextchild).scrollintoview({
						   duration: 0
					   });
					   return false;
					}
					else if (e.keyCode === 40) {
					   container.show();
					   var nextchild = $(".item-active", container).index() + 1;
					   if (nextchild == container.children().length) nextchild = 0;
					   container.children().removeClass("item-active");
					   container.children().eq(nextchild).addClass("item-active");
					   if (options.type == "list")
						   container.children().eq(nextchild).click();
					   container.children().eq(nextchild).scrollintoview({
						   duration: 0
					   });
					   return false;
					}
					else if (e.keyCode === 27) {
						close();
					}
				}
				else if (e.keyCode===13)
					return false;
			})
			.keyup(function(event) {
				wrapper.css("min-width",$(this).outerWidth());
				if (!disabled && event.keyCode!=27 && event.keyCode!=39 && event.keyCode!=37)
				{
					if (event.keyCode!=38 && event.keyCode!=40)
					{
						$('.item-active').removeClass('item-active');
					}
					if (obj.val().length<options.minlen || 
						event.keyCode==38 || event.keyCode==40 || 
						(event.keyCode==13 && !options.enterkey)) return;
					//
					if (!options.enterkey || (options.enterkey && event.keyCode==13))
					{
						if (!options.requestkey)
						{
							options.requestkey = obj.attr("id") || "tinycomplete";
						}	
						$.ajax({
							type: options.requestmethod,
							url: options.requesturl,
							data: options.requestkey+'='+obj.val(),
							beforeSend: function() {
								$(".tc-spinner").removeClass("tc-spinner");
								obj.addClass("tc-spinner");
								if (options.enterkey) {
									obj.attr("readonly","readonly");
								}
							},
							success: function(response) {
								if (options.responsetype == 'json')
								{
									var html = '';
									if (response.data)
									{
										html = '<ul class="tc-container">';
										$.each(response.data, function(i,row) {
											html += response.tpl.replace(/{([^{} ]+)}/g, function(match, contents) {
												return row[contents];
											});
										});
										html += '</ul>';
									}
									response = html;
								}
								if ($(":focus").is(obj) || options.type=="list") {
									wrapper.html(response);
									container = wrapper.find(".tc-container");
									container.children().addClass(options.itemclass)
									.eq(0).addClass('item-active').scrollintoview();
									container.css("overflow-y", ((options.type=="combo" && container.children().length<2)?"hidden":"scroll"));
									if (options.type=="list")
									{
										// self.focus(1e3);
										container.children().click(function(e) {
											if (!$(e.target).closest("."+options.itemoperations).length) {
												self.deactivate();
												$(this).addClass("item-active");
												self.focus();
											}
										}).eq(0).click();
									}
									else {
										container.children().mouseover(function() {
											self.deactivate();
											$(this).addClass("item-active");
										}).click(function(e) {
											if (!$(e.target).closest("."+options.itemoperations).length) {
												obj.val($(this).data("val") || $.trim($(this).text()));
												if ($(this).data("hiddenVal")) {
													if (!obj.prev('.'+options.hiddenobj).length) obj.before('<input class="'+options.hiddenobj+'" type="hidden">');
													obj.prev('.'+options.hiddenobj).val($(this).data("hiddenVal"));
												}
												close();
												disabled = true;
											}
										});
									}
									if ($.type(options.callback)==="function") {
										options.callback.call(this,obj,self);
									}
								}
								obj.removeClass("tc-spinner");
								if (options.enterkey) obj.removeAttr("readonly");
							}
						});
					}
				}
				disabled = false;
			})
			.click(function() {
				if (container && options.type=="combo") {
					self.deactivate();
					container.show().children().eq(0).addClass('item-active')
					.scrollintoview();
				}
			})
			.focus(function() {
				obj.removeData("internalFocus");
			})
			.blur(function() {
				if (container) {
					if (options.type=="combo" && !obj.data("internalFocus")) {
						container.fadeOut('fast');
					}
					obj.removeData("internalFocus");
					if (options.type=="list" && (!e_target || !e_target.closest("."+options.itemoperations).length))
						setTimeout(function() { obj.focus(); }, 0);
				}
			});
			if (!obj.next(".tc-wrapper").length)
				obj.after('<div class="tc-wrapper"></div>');
			wrapper = obj.next(".tc-wrapper");
			wrapper.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false)
			.mousedown(function(e) {
				e_target = $(e.target);
			}).mouseup(function() {
				obj.removeData("internalFocus");
				e_target = null;
			})
			.bind('mousewheel DOMMouseScroll', function(e) {
				if (options.type=="list" && e.type == 'DOMMouseScroll' || e.type == 'mousewheel') {
					if (e.originalEvent.detail==-3 || e.originalEvent.wheelDelta==120)
						obj.trigger($.Event('keydown',{keyCode:38}));
					else if (e.originalEvent.detail==3 || e.originalEvent.wheelDelta==-120)
						obj.trigger($.Event('keydown',{keyCode:40}));
					e.preventDefault();
				}
			});
			if (options.type=="combo")
			{	// ( for IE )
				$(document).mousedown(function(e) {
					if ($(e.target).closest(wrapper).length) {
						obj.data("internalFocus",true);
						self.focus(0);
						return false;
					}
				});
			}
			else options.enterkey = true;
			$(window).resize(function() {
				wrapper.css("min-width",obj.outerWidth());
			});
			self.run = function() {
				obj.focus().trigger($.Event('keyup',{keyCode:13}));
			};
			self.deactivate = function() {
				$(".item-active",container).removeClass("item-active");
			};
			// not test yet..
			self.activate = function(item) {
				if (options.type!="list") return;
				self.deactivate();
				container.children().eq(item).addClass('item-active').click()
				.scrollintoview();
			};
			self.focus = function(delay) {
				if (!obj.is(":focus")) {
					if (delay===undefined) obj.focus();
					else setTimeout(function() {obj.focus();}, delay);
				}
			};
			if (!options.minlen)
			{
				self.run();
			}
			// return self;
		};
		this.each(function() {
			if(!$.data(this, "tinycomplete"))
			{
				$.data(this, "tinycomplete", new TC($(this)));
			}
		});
		return this.data("tinycomplete");
	};
})(jQuery);